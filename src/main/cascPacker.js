import fs from 'fs'
import path from 'path'
import { openCASC, closeCASC, listFiles, readFile } from './casc.js'

// Format:
// 'CASC' (4 bytes)
// EntryCount (4 bytes, uint32 LE)
// TOC [ NameLength (2 bytes, uint16 LE) | Name (Variable) | Offset (8 bytes, BigUInt64 LE) | Size (4 bytes, UInt32 LE) ] * EntryCount
// Data Blocks...

const MAGIC = Buffer.from('CASC')

export async function packCascData(scPath, targetPath, onProgress) {
  let hStorage = null
  let fd = null
  try {
    hStorage = openCASC(scPath)
    if (!hStorage) throw new Error('Failed to open CASC storage.')

    onProgress({ percent: 5, currentFile: 'Listing unit graphics...' })
    
    let allFiles = listFiles(hStorage, 'unit*')
    let sdFiles = listFiles(hStorage, 'SD/unit*')
    let fileSet = new Set([...allFiles, ...sdFiles])
    
    // Additional essential files
    fileSet.add('arr/images.tbl')
    fileSet.add('arr/units.dat')
    fileSet.add('arr/sprites.dat')
    fileSet.add('game/tunit.pcx')
    fileSet.add('game/ticon.pcx')
    fileSet.add('scripts/iscript.bin')

    const fileList = Array.from(fileSet)
    onProgress({ percent: 10, currentFile: `Scanning ${fileList.length} files...` })

    fd = fs.openSync(targetPath, 'w')
    fs.writeSync(fd, MAGIC)
    
    let currentOffset = 4n // After MAGIC
    const tocEntries = []
    
    for (let i = 0; i < fileList.length; i++) {
      const fileName = fileList[i]
      if (i % 50 === 0) {
        onProgress({ percent: 10 + Math.round((i / fileList.length) * 85), currentFile: `Packing ${fileName}...` })
      }
      
      const buffer = readFile(hStorage, fileName)
      if (buffer && buffer.byteLength > 0) {
        fs.writeSync(fd, buffer)
        tocEntries.push({
          name: fileName,
          offset: currentOffset,
          size: buffer.byteLength
        })
        currentOffset += BigInt(buffer.byteLength)
      }
    }
    
    onProgress({ percent: 96, currentFile: `Writing Table of Contents...` })

    // Build TOC Buffer
    let tocSize = 4 // Entry count
    for (const entry of tocEntries) {
      tocSize += 2 + Buffer.from(entry.name, 'utf8').length + 8 + 4
    }
    
    const tocBuffer = Buffer.alloc(tocSize)
    tocBuffer.writeUInt32LE(tocEntries.length, 0)
    
    let cursor = 4
    for (const entry of tocEntries) {
      const nameBuf = Buffer.from(entry.name, 'utf8')
      tocBuffer.writeUInt16LE(nameBuf.length, cursor)
      cursor += 2
      
      nameBuf.copy(tocBuffer, cursor)
      cursor += nameBuf.length
      
      tocBuffer.writeBigUInt64LE(entry.offset, cursor)
      cursor += 8
      
      tocBuffer.writeUInt32LE(entry.size, cursor)
      cursor += 4
    }
    
    const tocOffset = currentOffset
    fs.writeSync(fd, tocBuffer)
    
    // Write TOC Offset at the very end (8 bytes)
    const endHeader = Buffer.alloc(8)
    endHeader.writeBigUInt64LE(tocOffset, 0)
    fs.writeSync(fd, endHeader)
    
    onProgress({ percent: 100, currentFile: `Done.` })
  } finally {
    if (fd !== null) fs.closeSync(fd)
    if (hStorage) closeCASC(hStorage)
  }
}

let cachedTOC = null
let cachedPackPath = null

function loadTOC(packPath) {
  if (cachedPackPath === packPath && cachedTOC) return cachedTOC
  
  if (!fs.existsSync(packPath)) return new Map()
  
  const fd = fs.openSync(packPath, 'r')
  const stats = fs.fstatSync(fd)
  if (stats.size < 12) {
    fs.closeSync(fd)
    throw new Error('Datapack is too small')
  }
  
  const magicBuf = Buffer.alloc(4)
  fs.readSync(fd, magicBuf, 0, 4, 0)
  if (!magicBuf.equals(MAGIC)) {
    fs.closeSync(fd)
    throw new Error('Invalid datapack magic')
  }
  
  // Read TOC Offset from the last 8 bytes
  const tailBuf = Buffer.alloc(8)
  fs.readSync(fd, tailBuf, 0, 8, stats.size - 8)
  const tocOffset = Number(tailBuf.readBigUInt64LE(0))
  
  const tocSize = stats.size - 8 - tocOffset
  if (tocSize < 4) {
    fs.closeSync(fd)
    throw new Error('Invalid TOC size')
  }
  
  const tocBuf = Buffer.alloc(tocSize)
  fs.readSync(fd, tocBuf, 0, tocSize, tocOffset)
  fs.closeSync(fd)
  
  const entryCount = tocBuf.readUInt32LE(0)
  const toc = new Map()
  let cursor = 4
  
  for (let i = 0; i < entryCount; i++) {
    const nameLen = tocBuf.readUInt16LE(cursor)
    cursor += 2
    
    // Convert all backslashes to forward slashes when storing
    const name = tocBuf.toString('utf8', cursor, cursor + nameLen).replace(/\\/g, '/')
    cursor += nameLen
    
    const offset = Number(tocBuf.readBigUInt64LE(cursor))
    cursor += 8
    
    const size = tocBuf.readUInt32LE(cursor)
    cursor += 4
    
    toc.set(name.toLowerCase(), { offset, size })
  }
  
  cachedTOC = toc
  cachedPackPath = packPath
  return toc
}

export function readDatapackFile(packPath, internalPath) {
  internalPath = internalPath.replace(/\\/g, '/').toLowerCase()
  const toc = loadTOC(packPath)
  let entry = toc.get(internalPath)
  if (!entry) {
    // Try without leading / or with SD prefix
    entry = toc.get('sd/' + internalPath) || toc.get(internalPath.replace(/^sd\//, ''))
  }
  
  if (!entry) return null
  
  const fd = fs.openSync(packPath, 'r')
  const buffer = Buffer.alloc(entry.size)
  fs.readSync(fd, buffer, 0, entry.size, entry.offset)
  fs.closeSync(fd)
  
  return buffer
}


