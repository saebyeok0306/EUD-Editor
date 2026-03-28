import { app } from 'electron'
import path from 'path'
import koffi from 'koffi'
import fs from 'fs'

const isDev = !app.isPackaged
const arch = process.arch === 'x64' ? 'x64' : 'x32'

const dllPath = isDev
  ? path.join(app.getAppPath(), 'resources', arch, 'CascLib.dll')
  : path.join(process.resourcesPath, arch, 'CascLib.dll')

let lib = null
let kernel32 = null
try {
  lib = koffi.load(dllPath)
  kernel32 = koffi.load('kernel32.dll')
} catch (err) {
  console.error(`Failed to load CascLib.dll from ${dllPath}:`, err)
}

const GetLastError = kernel32 ? kernel32.func('uint32_t GetLastError()') : () => 0

function getFunc(name, proto) {
  if (!lib) return null
  try {
    return lib.func(proto)
  } catch (e) {
    try {
      const protoA = proto.replace(name, name + 'A')
      return lib.func(protoA)
    } catch (e2) {
      console.warn(`[CASC-DLL] Could not bind ${name}: ${e2.message}`)
      return null
    }
  }
}

// Function definitions (subset of CascLib)
const CascOpenStorage = getFunc('CascOpenStorage', 'bool CascOpenStorage(const char * szStoragePointer, uint32_t dwLocales, void * phStorage)')
const CascCloseStorage = getFunc('CascCloseStorage', 'bool CascCloseStorage(void * hStorage)')
const CascOpenFile = getFunc('CascOpenFile', 'bool CascOpenFile(void * hStorage, const char * szFileName, uint32_t dwLocale, uint32_t dwFlags, void * phFile)')
const CascCloseFile = getFunc('CascCloseFile', 'bool CascCloseFile(void * hFile)')
const CascGetFileSize = getFunc('CascGetFileSize', 'uint32_t CascGetFileSize(void * hFile, void * pdwFileSizeHigh)')
const CascReadFile = getFunc('CascReadFile', 'bool CascReadFile(void * hFile, void * lpBuffer, uint32_t dwToRead, void * pdwRead)')
const CascFindFirstFile = getFunc('CascFindFirstFile', 'void * CascFindFirstFile(void * hStorage, const char * szMask, void * pFindFileData, const char * szListFile)')
const CascFindNextFile = getFunc('CascFindNextFile', 'bool CascFindNextFile(void * hFind, void * pFindFileData)')
const CascFindClose = getFunc('CascFindClose', 'bool CascFindClose(void * hFind)')

export function openCASC(storagePath) {
  if (!lib || !CascOpenStorage) throw new Error('CascLib not loaded or CascOpenStorage missing')
  
  const tryOpen = (p) => {
    console.log(`[CASC-DLL] Attempting CascOpenStorage for: ${p}`)
    const phStorage = Buffer.alloc(8)
    
    let result = CascOpenStorage(p, 0, phStorage)
    if (!result) {
      result = CascOpenStorage(p, 0xFFFFFFFF, phStorage)
    }
    
    if (result) {
      const h = phStorage.readBigUint64LE(0)
      if (h !== 0n) return h
    }
    return null
  }

  let hStorage = tryOpen(storagePath)
  
  if (!hStorage && !storagePath.toLowerCase().endsWith('data')) {
    const dataPath = path.join(storagePath, 'Data')
    if (fs.existsSync(dataPath)) {
      hStorage = tryOpen(dataPath)
    }
  }

  if (!hStorage) {
    const err = GetLastError()
    throw new Error(`CascOpenStorage failed with error code: ${err}`)
  }

  return hStorage
}

export function closeCASC(hStorage) {
  if (lib && hStorage && CascCloseStorage) CascCloseStorage(hStorage)
}

export function readFile(hStorage, fileName) {
  if (!lib || !hStorage || !CascOpenFile) return null
  
  const phFile = Buffer.alloc(8)
  if (!CascOpenFile(hStorage, fileName, 0, 0, phFile)) {
    const err = GetLastError()
    console.warn(`CascOpenFile failed for ${fileName} with error: ${err}`)
    return null
  }
  
  const hFile = phFile.readBigUint64LE(0)
  const pdwFileSizeHigh = Buffer.alloc(4)
  const fileSize = CascGetFileSize(hFile, pdwFileSizeHigh)
  
  const buffer = Buffer.alloc(fileSize)
  const pdwRead = Buffer.alloc(4)
  
  const result = CascReadFile(hFile, buffer, fileSize, pdwRead)
  if (!result) {
    const err = GetLastError()
    console.warn(`CascReadFile failed for ${fileName} with error: ${err}`)
  }
  CascCloseFile(hFile)
  
  return result ? buffer : null
}

export function listFiles(hStorage, mask = '*') {
  if (!lib || !hStorage || !CascFindFirstFile) return []
  
  const results = []
  const findData = Buffer.alloc(1024)
  const hFind = CascFindFirstFile(hStorage, mask, findData, null)
  
  if (hFind && hFind !== 0n) {
    do {
      const fileName = koffi.decode(findData, 'char[260]')
      results.push(fileName)
    } while (CascFindNextFile && CascFindNextFile(hFind, findData))
    
    if (CascFindClose) CascFindClose(hFind)
  }
  
  return results
}
