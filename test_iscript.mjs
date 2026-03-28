import { openCASC, readFile, closeCASC } from './src/main/casc.js'

const hStorage = openCASC('D:/StarCraft') // User path
if (hStorage) {
  const buf = readFile(hStorage, 'scripts/iscript.bin')
  if (buf) {
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
    const tabOffset = view.getUint16(0, true)
    console.log("Table Offset:", tabOffset)
    
    const id = 69
    const entryPtr = tabOffset + id * 2
    const entryOffset = view.getUint16(entryPtr, true)
    console.log(`Marine Iscript (ID 69) Header Offset: ${entryOffset}`)
    
    if (entryOffset < buf.byteLength) {
      console.log(`Header Magic/Type (around ${entryOffset}):`, buf.subarray(entryOffset, entryOffset + 32).toString('hex'))
      const type = buf[entryOffset + 4]
      console.log(`Type: ${type}`)
      
      const animsCount = type === 2 ? 14 : 2
      console.log(`Assuming ${animsCount} animations...`)
      for(let i=0; i<animsCount; i++) {
        const aOff = view.getUint16(entryOffset + 8 + i * 2, true)
        console.log(`  Anim ${i} Offset: ${aOff}`)
        if (aOff > 0 && aOff < buf.byteLength) {
           console.log(`    Bytes:`, buf.subarray(aOff, aOff + 10).toString('hex'))
        }
      }
    }
  }
  closeCASC(hStorage)
}
