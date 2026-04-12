/**
 * Parses the require.dat file which holds unit/upgrade/tech requirement opcode sequences.
 */

export async function parseRequireDatFile(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} when fetching ${url}`)
  const arrayBuffer = await res.arrayBuffer()
  const dv = new DataView(arrayBuffer)

  // 5 sections pointer counts mapping
  // Units: 228, Upgrades: 61, TechRes: 44, TechUse: 44, Orders: 189
  const PTR_COUNTS = {
    units: 228,
    upgrades: 61,
    techdata: 44, // Tech research
    techuse: 44, // Tech use
    orders: 189
  }
  
  const POINTERS_END = 1132 // Bytes where opcode data starts

  let offset = 0
  const categories = {}
  
  for (const [catName, count] of Object.entries(PTR_COUNTS)) {
    categories[catName] = []
    for (let i = 0; i < count; i++) {
      const ptr = dv.getUint16(offset, true)
      categories[catName].push(ptr)
      offset += 2
    }
  }

  const parsedData = {}
  Object.keys(categories).forEach(cat => {
    parsedData[cat] = []
  })

  for (const [catName, ptrs] of Object.entries(categories)) {
    ptrs.forEach((ptr) => {
      // In EUD Editor serialization, pointer = 0 means "Disabled" (사용안함)
      if (ptr === 0) {
        parsedData[catName].push({ mode: 'disabled', opcodes: [] })
        return
      }

      const opcodes = []
      let seqPos = POINTERS_END + (ptr * 2)

      // Protect against out-of-bounds readings
      while (seqPos < dv.byteLength) {
        const val = dv.getUint16(seqPos, true)
        seqPos += 2

        if (val === 0xFFFF) {
          opcodes.push({ opcode: 0, param: undefined }) // 0xFFFF -> End of Sublist
          break
        }

        if (val > 0x00FF) {
          const opcodeIndex = val - 0xFF00
          // EUD Editor parses these opcodes with params
          if ([2, 3, 4, 37].includes(opcodeIndex)) {
             const param = dv.getUint16(seqPos, true)
             seqPos += 2
             opcodes.push({ opcode: opcodeIndex, param })
          } else {
             // Upgrades 31, 32, 33 and others take NO param in the binary stream
             opcodes.push({ opcode: opcodeIndex, param: undefined })
          }
        } else {
          // Implicit "Must have..." (Index 3). The unit ID is exactly the value.
          opcodes.push({ opcode: 3, param: val })
        }
      }
      
      // If sequence is just [FFFF], it means "Always Allow" (무조건 허용)
      if (opcodes.length === 1 && opcodes[0].opcode === 0) {
        parsedData[catName].push({ mode: 'always', opcodes: [] })
        return
      }

      // Default mapped requirement
      parsedData[catName].push({ mode: 'custom', opcodes })
    })
  }

  return parsedData
}
