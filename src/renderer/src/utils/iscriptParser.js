/**
 * iscriptParser.js
 * Comprehensive StarCraft iscript.bin parser with SCPE and Standard header support.
 */

export const OPCODES = {
  PLAYFRAM: 0x00,
  WAIT: 0x05,
  GOTO: 0x07,
  END: 0x28, 
}

// Opcode lengths (including opcode byte itself)
const OPCODE_LENGTHS = new Uint8Array(256);
OPCODE_LENGTHS.fill(1); // Default is 1 byte

OPCODE_LENGTHS[0x00] = 3; // playfram [u16]
OPCODE_LENGTHS[0x05] = 2; // wait [u8]
OPCODE_LENGTHS[0x06] = 3; // waitrand [u8] [u8]
OPCODE_LENGTHS[0x07] = 3; // goto [u16]
OPCODE_LENGTHS[0x08] = 5; // imgol [u16] [s8] [s8]
OPCODE_LENGTHS[0x09] = 5; // imgul [u16] [s8] [s8]
OPCODE_LENGTHS[0x0D] = 3; // playsnd [u16]
OPCODE_LENGTHS[0x10] = 5; // domissile [u16 weapon] [s8 x] [s8 y]
OPCODE_LENGTHS[0x12] = 2; // followmain [u8 anim]
OPCODE_LENGTHS[0x13] = 4; // randcondjmp [u8 chance] [u16 offset]
OPCODE_LENGTHS[0x19] = 2; // setrot [u8 rotation]
OPCODE_LENGTHS[0x20] = 5; // sprol [u16 image] [s8 x] [s8 y]
OPCODE_LENGTHS[0x21] = 5; // sprul [u16 image] [s8 x] [s8 y]
OPCODE_LENGTHS[0x29] = 2; // setflip [u8 flip]
OPCODE_LENGTHS[0x2B] = 2; // attack [u8 type]
OPCODE_LENGTHS[0x2C] = 2; // attackwith [u8 type]
OPCODE_LENGTHS[0x2F] = 2; // move [u8]
OPCODE_LENGTHS[0x40] = 2; // setprio [u8]

export class IScriptParser {
  constructor(buffer) {
    const ab = (buffer.buffer instanceof ArrayBuffer) ? buffer.buffer : buffer
    this.buffer = new Uint8Array(ab, buffer.byteOffset || 0, buffer.byteLength)
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength)
    this.tableOffset = this.view.getUint16(0, true)
  }

  getAnimationOffsets(iscriptId) {
    // Mask to 16-bit to handle potential 32-bit offset errors
    const realId = iscriptId & 0xFFFF
    const entryOffsetPtr = this.tableOffset + (realId * 2)
    
    if (entryOffsetPtr >= this.view.byteLength) return null
    const entryOffset = this.view.getUint16(entryOffsetPtr, true)
    
    // Very basic validity check
    if (entryOffset < 10 || entryOffset >= this.view.byteLength) return null

    // Check Header - Magic "SCPE" (0x53 0x43 0x50 0x45)
    const magic = this.view.getUint32(entryOffset, true)
    let type = 0
    let animCount = 0
    let ptrStart = 0

    if (magic === 0x45504353) { // SCPE
      animCount = this.view.getUint32(entryOffset + 4, true)
      ptrStart = entryOffset + 8
      type = 2 
    } else {
      // Standard - ID(2) + Type(1) + Count(1)
      type = this.buffer[entryOffset + 2]
      animCount = this.buffer[entryOffset + 3]
      ptrStart = entryOffset + 4
    }

    const all = []
    for (let i = 0; i < animCount; i++) {
      const ptr = ptrStart + (i * 2)
      if (ptr + 2 <= this.view.byteLength) {
        const addr = this.view.getUint16(ptr, true)
        all.push(addr > 0 && addr < this.view.byteLength ? addr : 0)
      }
    }

    const offsets = { type, animCount, Init: 0, Death: 0, Walking: 0, all }
    if (all.length > 0) offsets.Init = all[0]
    if (all.length > 1) offsets.Death = all[1]
    
    // Movement animation index varies (usually 6 for ground units or 11 for some types)
    if (type === 2 || type === 12) {
       offsets.Walking = (all.length > 11 && all[11] > 0) ? all[11] : 
                         (all.length > 6 && all[6] > 0) ? all[6] : (all[0] || 0)
    } else {
       offsets.Walking = all[0] || 0
    }

    return offsets
  }

  readOpcode(offset) {
    if (offset >= this.view.byteLength) return { op: 'END', param: null, len: 1 }
    const code = this.buffer[offset]
    const len = OPCODE_LENGTHS[code] || 1
    
    let op = 'SKIP';
    let param = null;

    if (code === OPCODES.PLAYFRAM) {
      op = 'PLAYFRAM';
      param = this.view.getUint16(offset + 1, true);
    } else if (code === OPCODES.WAIT) {
      op = 'WAIT';
      param = this.buffer[offset + 1];
    } else if (code === OPCODES.GOTO) {
      op = 'GOTO';
      param = this.view.getUint16(offset + 1, true);
    } else if (code === OPCODES.END) {
      op = 'END';
    } else if (code === 0x03) {
      op = 'END';
    }

    return { op, param, len, code }
  }
}
