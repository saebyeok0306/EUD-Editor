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

export function resolvePalettePath(targetPath, currentTileset = 'badlands') {
  if (!targetPath) return { type: 'pcx', path: 'game/tunit.pcx', fallback: 'SC_unit_building.act' }
  const lowerPath = targetPath.toLowerCase()
  const basename = lowerPath.split('/').pop()
  
  // 1. UI icons (Wireframes)
  if (lowerPath.includes('wirefram')) {
    return { type: 'pcx', path: 'game/ticon.pcx', fallback: 'Icons.act' }
  }
  
  // 2. Tileset dependent features
  if (lowerPath.includes('tileset') || ['minerals.grp', 'geyser.grp', 'vespene.grp'].includes(basename)) {
    return { type: 'wpe', path: `${currentTileset}.wpe`, fallback: 'badlands.wpe' }
  }
  
  // 3. Normal units and neutral buildings
  return { type: 'pcx', path: 'game/tunit.pcx', fallback: 'SC_unit_building.act' }
}

export async function loadPalette(targetPath, currentTileset = 'badlands') {
  const rule = resolvePalettePath(targetPath, currentTileset)
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
    } else if (rule.type === 'wpe') {
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
