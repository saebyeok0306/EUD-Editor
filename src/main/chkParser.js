export function extractChkSection(buffer, sectionName) {
  let offset = 0;
  while (offset < buffer.length - 8) {
    const name = buffer.toString('utf8', offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    
    if (name === sectionName) {
      return buffer.subarray(offset + 8, offset + 8 + size);
    }
    offset += 8 + size;
  }
  return null;
}

export function parseUnixSection(unixBuffer) {
  if (!unixBuffer) return null;
  
  // Format based on CHK specs for 'UNIx' (Brood War unit settings)
  // Usually 228 units
  const NUM_UNITS = 228;
  const units = [];
  
  let offsetUseDefaults = 0;
  let offsetHitPoints = NUM_UNITS * 1;
  let offsetShieldPoints = offsetHitPoints + (NUM_UNITS * 4); // SP is 2 bytes
  let offsetArmor = offsetShieldPoints + (NUM_UNITS * 2); // Armor is 1 byte
  let offsetBuildTime = offsetArmor + (NUM_UNITS * 1); // Build time is 2 bytes
  let offsetMineralCost = offsetBuildTime + (NUM_UNITS * 2); // 2 bytes
  let offsetGasCost = offsetMineralCost + (NUM_UNITS * 2); // 2 bytes
  let offsetStringId = offsetGasCost + (NUM_UNITS * 2); // 2 bytes
  
  // Basic properties
  for (let i = 0; i < NUM_UNITS; i++) {
    const useDefault = unixBuffer.readUInt8(offsetUseDefaults + i);
    const rawHp = unixBuffer.readUInt32LE(offsetHitPoints + (i * 4));
    const shield = unixBuffer.readUInt16LE(offsetShieldPoints + (i * 2));
    const armor = unixBuffer.readUInt8(offsetArmor + i);
    const buildTime = unixBuffer.readUInt16LE(offsetBuildTime + (i * 2));
    const minerals = unixBuffer.readUInt16LE(offsetMineralCost + (i * 2));
    const gas = unixBuffer.readUInt16LE(offsetGasCost + (i * 2));

    units.push({
      id: i,
      useDefault: useDefault === 1,
      rawHp: rawHp,
      shield,
      armor,
      buildTime,
      minerals,
      gas
    });
  }
  
  // Weapon data (100 for original, 130 for Brood War)
  const offsetWeaponBase = offsetStringId + (NUM_UNITS * 2);
  const numWeapons = (unixBuffer.length - offsetWeaponBase) / 4;
  const offsetWeaponUpgrade = offsetWeaponBase + (numWeapons * 2);
  
  const weapons = {
    baseDamage: [],
    upgradeBonus: []
  };
  
  for (let i = 0; i < numWeapons; i++) {
    weapons.baseDamage.push(unixBuffer.readUInt16LE(offsetWeaponBase + (i * 2)));
    weapons.upgradeBonus.push(unixBuffer.readUInt16LE(offsetWeaponUpgrade + (i * 2)));
  }

  return { units, weapons };
}
