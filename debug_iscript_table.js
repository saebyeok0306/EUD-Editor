const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'renderer', 'src', 'data', 'iscript.bin');

try {
  const buf = fs.readFileSync(filePath);
  const tableOffset = buf.readUInt16LE(0);
  console.log("Table starts at:", tableOffset);

  if (tableOffset >= buf.length) {
    console.error("Invalid table offset!");
    process.exit(1);
  }

  // Check the table entries
  for (let i = 0; i < 20; i++) {
    const ptr = buf.readUInt16LE(tableOffset + i * 2);
    if (ptr > 0 && ptr < buf.length) {
       console.log(`ID ${i} -> Header at: ${ptr}, Bytes: ${buf.subarray(ptr, ptr + 8).toString('hex')}`);
    } else {
       console.log(`ID ${i} -> Empty (${ptr})`);
    }
  }

  // Marine (ID 69)
  const id69Ptr = buf.readUInt16LE(tableOffset + 69 * 2);
  console.log(`Marine (ID 69, Image 61?) -> Header at: ${id69Ptr}`);
  if (id69Ptr > 0 && id69Ptr < buf.length) {
    console.log(`Bytes at ${id69Ptr}:`, buf.subarray(id69Ptr, id69Ptr + 16).toString('hex'));
  } else {
    console.log(`ID 69 is empty at ptr ${id69Ptr}`);
  }

} catch (err) {
  console.error("Error:", err.message);
}
