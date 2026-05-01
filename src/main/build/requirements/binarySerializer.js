import { getOriginalOpcodes } from './baselineLoader.js';

/**
 * Serialize requirements binary — mirrors VB's RepDataToFile() exactly.
 *
 * VB structure per category:
 *   fileCreator.Position = sum(Ptr[0..i-1])
 *   StartOffset = Position / 2
 *   Write(0)                          ← initial zero word
 *   For k = 0 To Count-1
 *     Case 0: if original pos!=0 → Write(k), set pos, Write(Code...), Write(0xFFFF)
 *     Case 1: pos = 0
 *     Case 2: Write(k), set pos, Write(0xFFFF)
 *     Case 3: Write(k), set pos, Write(Code...), Write(0xFFFF)
 *   Next
 *   Write(0xFFFF)                     ← category terminator
 */
export function serializeRequirements(categoriesConfig, projectData, baseReqData) {
  const Ptr = [1096, 840, 320, 688, 1316];
  // EUD Editor's unrolled opcodes can exceed the vanilla 4260 byte capacity.
  // We allocate a larger buffer (10000 bytes) to prevent ERR_OUT_OF_RANGE,
  // and slice it to the actual used size at the end, matching EUD Editor's behavior.
  const outBuffer = Buffer.alloc(10000);

  const offsetMaps = [];
  let maxPosition = 4260; // Ensure it's at least the original capacity

  for (let i = 0; i < categoriesConfig.length; i++) {
    const cat = categoriesConfig[i];
    const catData = projectData[cat.name] || {};
    const offsetMap = new Array(cat.count).fill(0);
    offsetMaps.push(offsetMap);

    // VB: fileCreator.Position = 0; For j=0 To i-1: Position += Ptr(j)
    let position = 0;
    for (let j = 0; j < i; j++) {
      position += Ptr[j];
    }
    const StartOffset = Math.floor(position / 2);

    // filebinaryw.Write(CUShort(0))
    outBuffer.writeUInt16LE(0, position);
    position += 2;
    maxPosition = Math.max(maxPosition, position);

    for (let k = 0; k < cat.count; k++) {
      const entryData = catData[String(k)] || {};
      const req = entryData.reqData;

      // Determine ProjectRequireDataUSE equivalent
      // 0=기본값, 1=사용안함, 2=무조건허용, 3=사용자정의
      let useMode = 0;
      if (req) {
        if (req.mode === 'disabled') useMode = 1;
        else if (req.mode === 'always') useMode = 2;
        else if (req.mode === 'custom') useMode = 3;
      }

      // Initialize offsetMap[k] to 0 (Disabled) by default, 
      // which aligns with EUD Editor VB's bug of pointing to 0x0000.
      offsetMap[k] = 0;

      switch (useMode) {
        case 0: { // 기본값
          // VB: If RequireData(i)(k).pos <> 0 Then
          const originalOpcodes = getOriginalOpcodes(baseReqData, i, k);
          if (originalOpcodes && originalOpcodes.length > 0) {
            if (k === 0) {
              // Legacy EUD Editor 2 explicitly writes CUShort(k) and 0xFFFF for k=0
              outBuffer.writeUInt16LE(k, position);
              position += 2;

              // VB: pos = fileCreator.Position \ 2 - StartOffset
              // fileCreator.Position is AFTER Write(k), so pointer skips CUShort(k).
              offsetMap[k] = Math.floor(position / 2) - StartOffset;

              for (const op of originalOpcodes) {
                outBuffer.writeUInt16LE(op, position);
                position += 2;
              }

              // Always write 0xFFFF for k=0 to match the exact 7-word size (1 + 5 + 1)
              outBuffer.writeUInt16LE(0xFFFF, position);
              position += 2;
            } else {
              // For k > 0, Legacy EUD Editor 2 only writes the parsed Code, 
              // dropping the padding and skipping CUShort(k) and the extra 0xFFFF.
              offsetMap[k] = Math.floor(position / 2) - StartOffset;

              for (const op of originalOpcodes) {
                outBuffer.writeUInt16LE(op, position);
                position += 2;
              }
            }
          }
          break;
        }

        case 1: { // 사용안함
          // EUD Editor originally used 0, which points to opcode 0x0000.
          offsetMap[k] = 0;
          break;
        }

        case 2: { // 무조건 허용
          // filebinaryw.Write(CUShort(k))
          outBuffer.writeUInt16LE(k, position);
          position += 2;

          // ProjectRequireData(i)(k).pos = fileCreator.Position \ 2 - StartOffset
          offsetMap[k] = Math.floor(position / 2) - StartOffset;

          // filebinaryw.Write(CUShort(&HFFFF))
          outBuffer.writeUInt16LE(0xFFFF, position);
          position += 2;
          break;
        }

        case 3: { // 사용자정의
          if (k === 0) {
            outBuffer.writeUInt16LE(k, position);
            position += 2;

            // VB: pos = fileCreator.Position \ 2 - StartOffset (after Write(k))
            offsetMap[k] = Math.floor(position / 2) - StartOffset;

            const codes = req.opcodes || [];
            let hasTerminator = false;
            for (const op of codes) {
              if (typeof op === 'number') {
                outBuffer.writeUInt16LE(op, position);
                position += 2;
                if (op === 0xFFFF) hasTerminator = true;
              } else {
                if (op.opcode === 0 || op.opcode === undefined) {
                  outBuffer.writeUInt16LE(0xFFFF, position);
                  position += 2;
                  hasTerminator = true;
                } else if (op.opcode === 39) {
                  // (Must have...) — raw unit ID, no 0xFF prefix (1 word)
                  outBuffer.writeUInt16LE(op.param || 0, position);
                  position += 2;
                } else if ([2, 3, 4, 37].includes(op.opcode)) {
                  outBuffer.writeUInt16LE(0xFF00 + op.opcode, position);
                  position += 2;
                  outBuffer.writeUInt16LE(op.param || 0, position);
                  position += 2;
                } else {
                  outBuffer.writeUInt16LE(0xFF00 + op.opcode, position);
                  position += 2;
                }
              }
            }

            // Always write 0xFFFF for k=0 to match exact 7-word size requirement
            if (!hasTerminator) {
              outBuffer.writeUInt16LE(0xFFFF, position);
              position += 2;
            }
          } else {
            // k > 0: No CUShort(k) prefix, no forced 0xFFFF suffix (unless in codes)
            offsetMap[k] = Math.floor(position / 2) - StartOffset;

            const codes = req.opcodes || [];
            for (const op of codes) {
              if (typeof op === 'number') {
                outBuffer.writeUInt16LE(op, position);
                position += 2;
              } else {
                if (op.opcode === 0 || op.opcode === undefined) {
                  outBuffer.writeUInt16LE(0xFFFF, position);
                  position += 2;
                } else if (op.opcode === 39) {
                  // (Must have...) — raw unit ID, no 0xFF prefix (1 word)
                  outBuffer.writeUInt16LE(op.param || 0, position);
                  position += 2;
                } else if ([2, 3, 4, 37].includes(op.opcode)) {
                  outBuffer.writeUInt16LE(0xFF00 + op.opcode, position);
                  position += 2;
                  outBuffer.writeUInt16LE(op.param || 0, position);
                  position += 2;
                } else {
                  outBuffer.writeUInt16LE(0xFF00 + op.opcode, position);
                  position += 2;
                }
              }
            }
          }
          break;
        }
      }
      maxPosition = Math.max(maxPosition, position);
    }

    // filebinaryw.Write(CUShort(&HFFFF)) — category terminator
    outBuffer.writeUInt16LE(0xFFFF, position);
    position += 2;
    maxPosition = Math.max(maxPosition, position);
  }

  return {
    buffer: outBuffer.slice(0, maxPosition),
    offsetMaps
  };
}
