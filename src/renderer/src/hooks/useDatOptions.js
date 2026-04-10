/**
 * useDatOptions.js
 *
 * Unified hook to generate searchable option lists for any DAT category.
 * Usage: const options = useDatOptions('flingy')
 *
 * Supported categories: unit, flingy, image, sfx, sprite, portrait
 */
import { useMemo } from 'react'
import {
  getUnitsData, getFlingyData, getImagesData, getSpritesData,
  getSfxdataData, getPortdataData,
  getSfxdataTbl, getImagesTbl
} from '../utils/datStore'

import unitsNamesText from '../data/Units.txt?raw'
import imagesNamesText from '../data/Images.txt?raw'
import portdataNamesText from '../data/Portdata.txt?raw'

const UNITS_NAMES = unitsNamesText.split(/\r?\n/).map(l => l.trim())
const IMAGES_NAMES = imagesNamesText.split(/\r?\n/).map(l => l.trim())
const PORTDATA_NAMES = portdataNamesText.split(/\r?\n/).map(l => l.trim())

function pad(id, digits = 3) {
  return id.toString().padStart(digits, '0')
}

function buildUnitOptions() {
  const data = getUnitsData()
  if (!data) return []

  const options = []
  for (let i = 0; i < data.length; i++) {
    const name = UNITS_NAMES[i] || `Unit ${i}`
    options.push({ value: i, label: `[${pad(i)}] ${name}` })
  }
  return options
}

function buildFlingyOptions() {
  const flingyData = getFlingyData()
  const spritesData = getSpritesData()
  const imagesData = getImagesData()
  const imagesTbl = getImagesTbl()
  if (!flingyData) return []

  const options = []
  for (let i = 0; i < flingyData.length; i++) {
    let name = `Flingy ${i}`

    // Resolve: Flingy → Sprite → Image → GRP File → imagesTbl path
    try {
      const spriteId = flingyData[i]?.['Sprite']
      if (spriteId !== undefined && spritesData?.[spriteId]) {
        const imageId = spritesData[spriteId]['Image File']
        if (imageId !== undefined) {
          // Try Images.txt first
          if (IMAGES_NAMES[imageId] && IMAGES_NAMES[imageId].trim()) {
            name = IMAGES_NAMES[imageId]
          } else if (imagesData?.[imageId] && imagesTbl) {
            const tblIndex = imagesData[imageId]['GRP File'] - 1
            if (imagesTbl[tblIndex]) {
              name = imagesTbl[tblIndex].split('\\').pop().split('/').pop()
            }
          }
        }
      }
    } catch (e) {
      // fallback to default name
    }

    options.push({ value: i, label: `[${pad(i)}] ${name}` })
  }
  return options
}

function buildImageOptions() {
  const data = getImagesData()
  const imagesTbl = getImagesTbl()
  if (!data) return []

  const options = []
  const keys = Object.keys(data)
  for (let k = 0; k < keys.length; k++) {
    const id = parseInt(keys[k], 10)
    let name = `Image ${id}`

    if (IMAGES_NAMES[id] && IMAGES_NAMES[id].trim()) {
      name = IMAGES_NAMES[id]
    } else if (imagesTbl) {
      const tblIndex = data[id]['GRP File'] - 1
      if (imagesTbl[tblIndex]) {
        name = imagesTbl[tblIndex].split('\\').pop().split('/').pop()
      }
    }

    options.push({ value: id, label: `[${pad(id)}] ${name}` })
  }
  return options
}

function buildSpriteOptions() {
  const data = getSpritesData()
  if (!data) return []

  const options = []
  for (let i = 0; i < data.length; i++) {
    const imageId = data[i]?.['Image File']
    let name = `Sprite ${i}`
    if (imageId !== undefined && IMAGES_NAMES[imageId] && IMAGES_NAMES[imageId].trim()) {
      name = IMAGES_NAMES[imageId]
    }
    options.push({ value: i, label: `[${pad(i)}] ${name}` })
  }
  return options
}

function buildSfxOptions() {
  const data = getSfxdataData()
  const tbl = getSfxdataTbl()
  if (!data) return []

  const options = [{ value: 0, label: '[000] None' }]
  for (let i = 1; i < data.length; i++) {
    const sfx = data[i]
    if (!sfx) continue

    let name = 'Unknown'
    const sndFileIdx = sfx['Sound File']
    if (sndFileIdx && sndFileIdx > 0 && tbl) {
      name = tbl[sndFileIdx - 1] || 'Unknown'
    }

    options.push({ value: i, label: `[${pad(i)}] ${name}` })
  }
  return options
}

function buildPortraitOptions() {
  const data = getPortdataData()
  if (!data) return []

  const options = []
  for (let i = 0; i < data.length; i++) {
    const name = PORTDATA_NAMES[i] || `Portrait ${i}`
    options.push({ value: i, label: `[${pad(i)}] ${name}` })
  }
  return options
}

const builders = {
  unit: buildUnitOptions,
  flingy: buildFlingyOptions,
  image: buildImageOptions,
  sprite: buildSpriteOptions,
  sfx: buildSfxOptions,
  portrait: buildPortraitOptions,
}

/**
 * Returns a memoized array of { value, label } options for the given DAT category.
 * @param {'unit'|'flingy'|'image'|'sprite'|'sfx'|'portrait'} category
 * @returns {{ value: number, label: string }[]}
 */
export default function useDatOptions(category) {
  return useMemo(() => {
    const builder = builders[category]
    if (!builder) {
      console.warn(`[useDatOptions] Unknown category: ${category}`)
      return []
    }
    return builder()
  }, [category])
}
