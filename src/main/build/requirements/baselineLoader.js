import fs from 'fs';
import path from 'path';

/**
 * Loads the original require.dat file serving as a baseline for unmodified requirements.
 */
export function loadBaselineRequireDat() {
  const rootDir = process.cwd();
  const requireDatPath = path.join(rootDir, 'src', 'renderer', 'src', 'dat', 'require.dat');

  if (fs.existsSync(requireDatPath)) {
    return fs.readFileSync(requireDatPath);
  }

  console.warn('[Requirements] Could not find baseline require.dat at', requireDatPath);
  return null;
}

/**
 * Reads original opcodes sequence from the binary for a given category and item index.
 * The original require.dat starts with 1132 bytes of pointer tables (2 bytes per entry).
 * After that, each category has its own data region (sizes: 1096, 840, 320, 688, 1316 bytes).
 * The ptr value in each pointer table entry is a LOCAL offset within that category's data region.
 */
export function getOriginalOpcodes(baseReq, catIdx, itemIdx) {
  if (!baseReq) return null;

  // Pointer table capacity per category
  const tableStarts = [0, 228, 228 + 61, 228 + 61 + 44, 228 + 61 + 44 + 44];
  const tableIndex = tableStarts[catIdx] + itemIdx;
  
  const ptr = baseReq.readUInt16LE(tableIndex * 2);
  if (ptr === 0) return null; // Disabled in EUD Editor logic

  // Each category's data starts at a different offset within the data block.
  // Ptr() = {1096, 840, 320, 688, 1316} in VB code (fixedSize per category)
  const catDataSizes = [1096, 840, 320, 688, 1316];
  let catDataStart = 0;
  for (let j = 0; j < catIdx; j++) {
    catDataStart += catDataSizes[j];
  }

  const opcodes = [];
  let pos = 1132 + catDataStart + ptr * 2;

  while (pos + 1 < baseReq.length) {
    const val = baseReq.readUInt16LE(pos);
    pos += 2;
    if (val === 0xFFFF) {
      opcodes.push(0xFFFF);
      break;
    }
    opcodes.push(val);
    
    // Opcodes that require parameters (2, 3, 4, 37 in EUD Editor correspond to 0xFF02, 0xFF03, 0xFF04, 0xFF25)
    if ([0xFF02, 0xFF03, 0xFF04, 0xFF25].includes(val)) {
      if (pos + 1 < baseReq.length) {
        opcodes.push(baseReq.readUInt16LE(pos));
        pos += 2;
      }
    }
  }
  
  return opcodes;
}
