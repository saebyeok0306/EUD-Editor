export function parseDef(defText) {
  const lines = defText.split(/\r?\n/);
  const header = {};
  const format = {};

  let currentSection = null;

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith(';')) continue;

    if (line.startsWith('[')) {
      currentSection = line.substring(1, line.length - 1);
      continue;
    }

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;
    const key = line.substring(0, eqIndex).trim();
    const value = line.substring(eqIndex + 1).trim();

    if (currentSection === 'HEADER') {
      header[key] = parseInt(value, 10);
    } else if (currentSection === 'FORMAT') {
      const match = key.match(/^(\d+)(.*)$/);
      if (match) {
        const id = parseInt(match[1], 10);
        const prop = match[2];
        if (!format[id]) format[id] = {};
        
        if (prop === 'Name') format[id].Name = value;
        else if (prop === 'Size') format[id].Size = parseInt(value, 10);
        else if (prop === 'Type') format[id].Type = parseInt(value, 10);
        else if (prop === 'VarStart') format[id].VarStart = parseInt(value, 10);
        else if (prop === 'VarEnd') format[id].VarEnd = parseInt(value, 10);
        else if (prop === 'VarArray') format[id].VarArray = parseInt(value, 10);
        else if (prop === 'VarArrayIndex') format[id].VarArrayIndex = parseInt(value, 10);
        else if (prop === 'InitVar') format[id].InitVar = parseInt(value, 10);
      }
    }
  }

  return { header, format };
}

export function parseDat(arrayBuffer, defData) {
  const { header, format } = defData;
  const entryCount = header.InputEntrycount || 228;
  const varCount = header.Varcount;
  const dataView = new DataView(arrayBuffer);
  
  const entries = Array.from({ length: entryCount }, (_, i) => ({ id: i }));

  let offset = 0;

  for (let i = 0; i < varCount; i++) {
    const fmt = format[i];
    if (!fmt) continue;

    const start = fmt.VarStart !== undefined ? fmt.VarStart : 0;
    const end = fmt.VarEnd !== undefined ? fmt.VarEnd : (entryCount - 1);
    const size = fmt.Size || 4;
    const arraySize = fmt.VarArray || 1;

    for (let index = start; index <= end; index++) {
      for (let arrIdx = 0; arrIdx < arraySize; arrIdx++) {
        let value = 0;
        
        if (offset + size <= arrayBuffer.byteLength) {
          if (size === 1) {
            value = dataView.getUint8(offset);
          } else if (size === 2) {
            value = dataView.getUint16(offset, true); // true for Little Endian
          } else if (size === 4) {
            value = dataView.getUint32(offset, true);
          }
        }
        
        offset += size;

        const propName = arraySize > 1 ? `${fmt.Name}_${arrIdx}` : fmt.Name;
        // Make sure index is in array bounds
        if (entries[index]) {
            entries[index][propName] = value;
        }
      }
    }
  }

  return entries;
}
