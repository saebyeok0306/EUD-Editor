/**
 * iscriptParser.js
 * Comprehensive StarCraft iscript.bin parser with SCPE and Standard header support.
 * Accurately implements opcode specifications based on AnimOpcodes.txt and AnimHeader.txt.
 */

export const OPCODES = {
  PLAYFRAM: 0x00,
  WAIT: 0x05,
  GOTO: 0x07,
  END: 0x16, // end
}

// Opcode lengths (including opcode byte itself)
const OPCODE_LENGTHS = new Uint8Array(256);
OPCODE_LENGTHS.fill(1); // Default to 1

// Defined lengths based on AnimOpcodes.txt parameters
OPCODE_LENGTHS[0x00] = 3; // playfram u16
OPCODE_LENGTHS[0x01] = 3; // playframtile u16
OPCODE_LENGTHS[0x02] = 2; // sethorpos u8
OPCODE_LENGTHS[0x03] = 2; // setvertpos u8
OPCODE_LENGTHS[0x04] = 3; // setpos u8 u8
OPCODE_LENGTHS[0x05] = 2; // wait u8
OPCODE_LENGTHS[0x06] = 3; // waitrand u8 u8
OPCODE_LENGTHS[0x07] = 3; // goto u16
OPCODE_LENGTHS[0x08] = 5; // imgol u16 u8 u8
OPCODE_LENGTHS[0x09] = 5; // imgul u16 u8 u8
OPCODE_LENGTHS[0x0a] = 3; // imgolorig u16
OPCODE_LENGTHS[0x0b] = 3; // switchul u16
// 0x0c: __0c (1)
OPCODE_LENGTHS[0x0d] = 5; // imgoluselo u16 u8 u8
OPCODE_LENGTHS[0x0e] = 5; // imguluselo u16 u8 u8
OPCODE_LENGTHS[0x0f] = 5; // sprol u16 u8 u8
OPCODE_LENGTHS[0x10] = 5; // highsprol u16 u8 u8
OPCODE_LENGTHS[0x11] = 5; // lowsprul u16 u8 u8
OPCODE_LENGTHS[0x12] = 3; // uflunstable u16
OPCODE_LENGTHS[0x13] = 5; // spruluselo u16 u8 u8
OPCODE_LENGTHS[0x14] = 5; // sprul u16 u8 u8
OPCODE_LENGTHS[0x15] = 4; // sproluselo u16 u8
OPCODE_LENGTHS[0x16] = 1; // end
OPCODE_LENGTHS[0x17] = 2; // setflipstate u8
OPCODE_LENGTHS[0x18] = 3; // playsnd u16
// 0x19: playsndrand (variable length, handled manually)
OPCODE_LENGTHS[0x1a] = 5; // playsndbtwn u16 u16
OPCODE_LENGTHS[0x1b] = 1; // domissiledmg
// 0x1c: attackmelee (variable length, handled manually)
OPCODE_LENGTHS[0x1d] = 1; // followmaingraphic
OPCODE_LENGTHS[0x1e] = 4; // randcondjmp u8 u16
OPCODE_LENGTHS[0x1f] = 2; // turnccwise u8
OPCODE_LENGTHS[0x20] = 2; // turncwise u8
OPCODE_LENGTHS[0x21] = 1; // turn1cwise
OPCODE_LENGTHS[0x22] = 2; // turnrand u8
OPCODE_LENGTHS[0x23] = 2; // setspawnframe u8
OPCODE_LENGTHS[0x24] = 2; // sigorder u8
OPCODE_LENGTHS[0x25] = 2; // attackwith u8
OPCODE_LENGTHS[0x26] = 1; // attack
OPCODE_LENGTHS[0x27] = 1; // castspell
OPCODE_LENGTHS[0x28] = 2; // useweapon u8
OPCODE_LENGTHS[0x29] = 2; // move u8
OPCODE_LENGTHS[0x2a] = 1; // gotorepeatattk
OPCODE_LENGTHS[0x2b] = 2; // engframe u8
OPCODE_LENGTHS[0x2c] = 2; // engset u8
// 0x2d: __2d (1 byte)
OPCODE_LENGTHS[0x2e] = 1; // nobrkcodestart
OPCODE_LENGTHS[0x2f] = 1; // nobrkcodeend
OPCODE_LENGTHS[0x30] = 1; // ignorerest
OPCODE_LENGTHS[0x31] = 2; // attkshiftproj u8
OPCODE_LENGTHS[0x32] = 1; // tmprmgraphicstart
OPCODE_LENGTHS[0x33] = 1; // tmprmgraphicend
OPCODE_LENGTHS[0x34] = 2; // setfldirect u8
OPCODE_LENGTHS[0x35] = 3; // call u16
OPCODE_LENGTHS[0x36] = 1; // return
OPCODE_LENGTHS[0x37] = 3; // setflspeed u16
OPCODE_LENGTHS[0x38] = 2; // creategasoverlays u8
OPCODE_LENGTHS[0x39] = 3; // pwrupcondjmp u16
OPCODE_LENGTHS[0x3a] = 5; // trgtrangecondjmp u16 u16
OPCODE_LENGTHS[0x3b] = 7; // trgtarccondjmp u16 u16 u16
OPCODE_LENGTHS[0x3c] = 7; // curdirectcondjmp u16 u16 u16
OPCODE_LENGTHS[0x3d] = 3; // imgulnextid u8 u8
// 0x3e: __3e (1)
OPCODE_LENGTHS[0x3f] = 3; // liftoffcondjmp u16
OPCODE_LENGTHS[0x40] = 3; // warpoverlay u16
OPCODE_LENGTHS[0x41] = 2; // orderdone u8
OPCODE_LENGTHS[0x42] = 5; // grdsprol u16 u8 u8
// 0x43: __43 (1)
OPCODE_LENGTHS[0x44] = 1; // dogrddamage

const ANIM_INDEX = {
  INIT: 0,
  DEATH: 1,
  GNDATTKINIT: 2,
  AIRATTKINIT: 3,
  UNUSED1: 4,
  GNDATTKRPT: 5,
  AIRATTKRPT: 6,
  CASTSPELL: 7,
  GNDATTKTOIDLE: 8,
  AIRATTKTOIDLE: 9,
  UNUSED2: 10,
  WALKING: 11,
};

export class IScriptParser {
  constructor(buffer) {
    const ab = (buffer.buffer instanceof ArrayBuffer) ? buffer.buffer : buffer
    this.buffer = new Uint8Array(ab, buffer.byteOffset || 0, buffer.byteLength)
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength)
    this.tableOffset = this.view.getUint16(0, true)
  }

  getAnimationOffsets(iscriptId) {
    const realId = iscriptId & 0xFFFF
    const entryOffsetPtr = this.tableOffset + (realId * 2)
    
    if (entryOffsetPtr >= this.view.byteLength) return null
    const entryOffset = this.view.getUint16(entryOffsetPtr, true)
    
    if (entryOffset < 10 || entryOffset >= this.view.byteLength) return null

    const magic = this.view.getUint32(entryOffset, true)
    let type = 0
    let animCount = 0
    let ptrStart = 0

    if (magic === 0x45504353) { // SCPE
      animCount = this.view.getUint32(entryOffset + 4, true)
      ptrStart = entryOffset + 8
      type = 2 
    } else {
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
    if (all.length > ANIM_INDEX.INIT) offsets.Init = all[ANIM_INDEX.INIT]
    if (all.length > ANIM_INDEX.DEATH) offsets.Death = all[ANIM_INDEX.DEATH]
    
    // Per AnimHeader.txt, Walking is index 11
    if (all.length > ANIM_INDEX.WALKING && all[ANIM_INDEX.WALKING] > 0) {
       offsets.Walking = all[ANIM_INDEX.WALKING]
    } else {
       offsets.Walking = all[ANIM_INDEX.INIT] || 0
    }

    return offsets
  }

  readOpcode(offset) {
    if (offset >= this.view.byteLength) return { op: 'END', param: null, len: 1, code: 0x16 }
    const code = this.buffer[offset]
    let len = OPCODE_LENGTHS[code] || 1
    
    // Check variable length opcodes: playsndrand (0x19) and attackmelee (0x1C)
    // Format: opcode(1) + numSounds(1) + soundID(2)*numSounds
    if (code === 0x19 || code === 0x1C) {
      if (offset + 1 < this.view.byteLength) {
        const numSounds = this.buffer[offset + 1]
        len = 2 + (numSounds * 2)
      } else {
        len = 2
      }
    }
    
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
    }

    return { op, param, len, code }
  }
}
