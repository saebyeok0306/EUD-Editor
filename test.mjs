import fs from 'node:fs';

/**
 * tblParser.js
 *
 * Parser for StarCraft 1 TBL (string table) binary files.
 */

export function parseTbl(buffer, encoding = 'EUC-KR') {
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const decoder = new TextDecoder(encoding);

  const count = view.getUint16(0, true); // Little-endian

  const strings = [];

  for (let i = 0; i < count; i++) {
    const offsetPtr = 2 + i * 2;
    const strOffset = view.getUint16(offsetPtr, true);

    // Find null terminator
    let end = strOffset;
    while (end < bytes.length && bytes[end] !== 0) {
      end++;
    }

    const slice = bytes.slice(strOffset, end);
    strings.push(decoder.decode(slice));
  }

  return strings;
}

// Correct file path: src/renderer/src/tbl/images.tbl
const filePath = './src/renderer/src/tbl/images.tbl';

try {
  const buffer = fs.readFileSync(filePath);
  const strings = parseTbl(buffer);
  console.log('Total strings:', strings.length);
  // Log first 10 for preview
  for (let i = 0; i<strings.length; i++) {
    console.log(i, strings[i]);
  }
  console.log("239: ", strings[239]);
} catch (err) {
  console.error('Error reading or parsing TBL:', err.message);
}
