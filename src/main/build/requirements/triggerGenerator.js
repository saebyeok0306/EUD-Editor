export function generateTriggers(categoriesConfig, offsetMaps) {
  const triggerLines = [];

  triggerLines.push('    # Requirement Pointer Data (EUD Editor Style)');
  triggerLines.push('    DoActions([');

  categoriesConfig.forEach((cat, catIdx) => {
    const offsetMap = offsetMaps[catIdx];
    const pointer = cat.table;

    let value = 0;
    for (let k = 0; k < cat.count; k++) {
      if (k % 2 === 0) {
        value = offsetMap[k] || 0;
      } else {
        value += (offsetMap[k] || 0) * 65536;
      }

      if (k % 2 === 1) {
        triggerLines.push(`        SetMemory(${pointer} + ${(k * 2) - 2}, SetTo, ${value}),`);
      }
    }
    
    // If count is odd, the last pointer was processed at an even index and not written.
    // We must write its lower 16 bits using SetMemoryX to preserve the upper 16 bits.
    if (cat.count % 2 === 1) {
      triggerLines.push(`        SetMemoryX(${pointer} + ${(cat.count - 1) * 2}, SetTo, ${value}, 0xFFFF),`);
    }
  });

  triggerLines.push('    ])');
  return triggerLines.join('\n');
}
