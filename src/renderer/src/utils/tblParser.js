/**
 * tblParser.js
 *
 * Parser for StarCraft 1 TBL (string table) binary files.
 *
 * File Format:
 *   [0x00] uint16  - Number of strings (N)
 *   [0x02] uint16  - Offset of string 0 (relative to start of file)
 *   [0x04] uint16  - Offset of string 1
 *   ...
 *   [0x02 + N*2] uint16 - Offset of string N-1
 *   [offsets...]  - Null-terminated strings (CP949 / Korean encoding)
 */

/**
 * Parse a TBL file from an ArrayBuffer.
 * @param {ArrayBuffer} arrayBuffer - Raw file bytes
 * @param {string} [encoding='EUC-KR'] - Text encoding of the strings (default: EUC-KR for Korean)
 * @returns {string[]} Array of decoded strings, indexed by string ID (1-based → index 0 = string #1)
 */
export function parseTbl(arrayBuffer, encoding = 'EUC-KR') {
  const view = new DataView(arrayBuffer)
  const bytes = new Uint8Array(arrayBuffer)
  const decoder = new TextDecoder(encoding)

  const count = view.getUint16(0, true) // Little-endian

  const strings = []

  for (let i = 0; i < count; i++) {
    const offsetPtr = 2 + i * 2
    const strOffset = view.getUint16(offsetPtr, true)

    // Find null terminator
    let end = strOffset
    while (end < bytes.length && bytes[end] !== 0) {
      end++
    }

    const slice = bytes.slice(strOffset, end)
    strings.push(decoder.decode(slice))
  }

  return strings
}
