const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'data', 'iscript.bin');

try {
  const buf = fs.readFileSync(filePath);
  console.log("File Size:", buf.length);
  console.log("First 64 Bytes (Hex):");
  
  let hex = "";
  for (let i = 0; i < Math.min(buf.length, 64); i++) {
    hex += buf[i].toString(16).padStart(2, '0') + " ";
    if ((i + 1) % 16 === 0) hex += "\n";
  }
  console.log(hex);

  // Check the table offset
  const tableOffset = buf.readUInt16LE(0);
  console.log("Table Offset (Byte 0-1):", tableOffset);

} catch (err) {
  console.error("Error reading iscript.bin:", err.message);
}
