const paletteCache = new Map()

// Helper to extract palette from PCX buffer
export function extractPcxPalette(buffer) {
  const data = new Uint8Array(buffer)
  for (let i = data.length - 769; i >= 0; i--) {
    if (data[i] === 0x0C && (data.length - i) >= 769) {
      return data.slice(i + 1, i + 769)
    }
  }
  return data.slice(data.length - 768)
}

export function resolvePalettePath(targetPath, currentTileset = 'badlands', drawFunction = 0, remapping = 0) {
  // 0. Special StarCraft Effect Palettes based on drawFunction
  if (drawFunction === 8) {
    return { type: 'act', path: 'EMP.act', fallback: 'EMP.act' }
  } else if (drawFunction === 9) {
    switch (remapping) {
      case 1: return { type: 'act', path: 'ofire.act', fallback: 'ofire.act' }
      case 2: return { type: 'act', path: 'gfire.act', fallback: 'gfire.act' }
      case 3: return { type: 'act', path: 'bfire.act', fallback: 'bfire.act' }
      case 4: return { type: 'act', path: 'bexpl.act', fallback: 'bexpl.act' }
    }
  } else if (drawFunction === 10) {
    return { type: 'act', path: 'shadow.act', fallback: 'shadow.act' }
  } else if (drawFunction === 16) {
    return { type: 'act', path: 'Hallulation.act', fallback: 'Hallulation.act' }
  }

  if (!targetPath) return { type: 'pcx', path: 'game/tunit.pcx', fallback: 'SC_unit_building.act' }
  const lowerPath = targetPath.toLowerCase()
  const basename = lowerPath.split('/').pop()
  
  // 1. UI icons (Wireframes, CmdIcons, Button Sets)
  if (lowerPath.includes('wirefram') || lowerPath.includes('cmdicon') || lowerPath.includes('icon')) {
    return { type: 'act', path: 'Icons.act', fallback: 'Icons.act' }
  }
  
  // 2. Tileset dependent features
  if (lowerPath.includes('tileset') || ['minerals.grp', 'geyser.grp', 'vespene.grp'].includes(basename)) {
    return { type: 'wpe', path: `${currentTileset}.wpe`, fallback: 'badlands.wpe' }
  }
  
  // 3. Normal units and neutral buildings
  return { type: 'pcx', path: 'game/tunit.pcx', fallback: 'SC_unit_building.act' }
}

export async function loadPalette(targetPath, currentTileset = 'badlands', drawFunction = 0, remapping = 0) {
  const rule = resolvePalettePath(targetPath, currentTileset, drawFunction, remapping)
  const cacheKey = rule.path
  
  if (paletteCache.has(cacheKey)) {
    return paletteCache.get(cacheKey)
  }
  
  try {
    let rawPalette = null
    
    if (rule.type === 'pcx') {
      const pcxBuffer = await window.api.getDatapackFile(rule.path)
      if (pcxBuffer) {
        rawPalette = extractPcxPalette(pcxBuffer)
        console.log(`[PaletteLoader] Loaded ${rule.path} from datapack`)
      }
    } else if (rule.type === 'wpe' || rule.type === 'act') {
      const wpeBuffer = await window.api.readLocalPalette(rule.path)
      if (wpeBuffer) {
        rawPalette = new Uint8Array(wpeBuffer)
        console.log(`[PaletteLoader] Loaded ${rule.path} from resources`)
      }
    }
    
    if (!rawPalette) {
      console.warn(`[PaletteLoader] Failed to load ${rule.path}, trying fallback ${rule.fallback}...`)
      const fallbackPalette = await window.api.readLocalPalette(rule.fallback)
      if (fallbackPalette) {
        rawPalette = new Uint8Array(fallbackPalette)
      }
    }
    
    if (rawPalette) {
      paletteCache.set(cacheKey, rawPalette)
      return rawPalette
    }
  } catch (err) {
    console.error(`[PaletteLoader] Error for ${cacheKey}:`, err)
  }
  
  return null
}
