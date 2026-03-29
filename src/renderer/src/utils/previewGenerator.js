import { getUnitsData, getFlingyData, getSpritesData, getImagesData, getImagesTbl } from './datStore'
import { decodeGRP, renderToCanvas, PLAYER_COLORS } from './grpDecoder'
import { loadPalette } from './paletteLoader'

export async function generateAllUnitPreviews(onProgress) {
  const unitsData = getUnitsData()
  const flingyData = getFlingyData()
  const spritesData = getSpritesData()
  const imagesData = getImagesData()
  const imagesTbl = getImagesTbl()

  if (!unitsData || !imagesData || !imagesTbl) {
    console.error('[PreviewGen] Required data not loaded yet.')
    return
  }

  const unitIds = Object.keys(unitsData)
  const total = unitIds.length

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  for (let i = 0; i < total; i++) {
    const unitId = unitIds[i]
    if (onProgress) {
      onProgress({ 
        percent: Math.round((i / total) * 100), 
        currentFile: `Generating preview for unit ${unitId}...` 
      })
    }

    try {
      const flingyId = unitsData[unitId]['Graphics']
      const spriteId = flingyData[flingyId]?.['Sprite']
      const imageId = spritesData[spriteId]?.['Image File']
      
      if (imageId === undefined || !imagesData[imageId]) continue

      const tblIndex = imagesData[imageId]['GRP File']
      let targetPath = imagesTbl[tblIndex - 1]
      if (!targetPath) continue

      targetPath = targetPath.replace(/\\/g, '/').replace(/^SD\//i, '').replace(/^SD\\/i, '')
      if (!targetPath.toLowerCase().startsWith('unit/')) targetPath = 'unit/' + targetPath
      targetPath = targetPath.replace(/\.[^/.]+$/, "") + ".grp"

      const grpBuffer = await window.api.getDatapackFile(targetPath)
      if (!grpBuffer) continue

      const frameData = decodeGRP(grpBuffer, 0)
      if (!frameData) continue

      // Auto-crop logic for preview
      let minX = frameData.width, minY = frameData.height, maxX = 0, maxY = 0
      const pixels = frameData.data
      let hasPixels = false
      for (let y = 0; y < frameData.height; y++) {
        for (let x = 0; x < frameData.width; x++) {
          if (pixels[y * frameData.width + x] !== 0) {
            if (x < minX) minX = x; if (y < minY) minY = y
            if (x > maxX) maxX = x; if (y > maxY) maxY = y
            hasPixels = true
          }
        }
      }

      let cropWidth = frameData.width, cropHeight = frameData.height
      let offsetX = 0, offsetY = 0

      if (hasPixels) {
        cropWidth = maxX - minX + 1
        cropHeight = maxY - minY + 1
        offsetX = minX
        offsetY = minY
      }

      const paletteToUse = await loadPalette(targetPath, 'badlands')

      // Render to offscreen canvas
      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = frameData.width
      tempCanvas.height = frameData.height
      renderToCanvas(tempCanvas.getContext('2d'), frameData, paletteToUse, PLAYER_COLORS['Orange'])

      // Prepare final preview canvas (max 44x44 for list)
      canvas.width = Math.min(cropWidth, 128)
      canvas.height = Math.min(cropHeight, 128)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(tempCanvas, offsetX, offsetY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/webp', 0.8)
      await window.api.saveUnitPreview(unitId, dataUrl)

    } catch (err) {
      console.warn(`[PreviewGen] Failed for unit ${unitId}:`, err)
    }
  }

  if (onProgress) onProgress({ percent: 100, currentFile: 'All previews generated.' })
}

export async function generateAllImagePreviews(onProgress) {
  const imagesData = getImagesData()
  const imagesTbl = getImagesTbl()

  if (!imagesData || !imagesTbl) {
    console.error('[PreviewGen] Required data not loaded yet.')
    return
  }

  const imageIds = Object.keys(imagesData)
  const total = imageIds.length

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  for (let i = 0; i < total; i++) {
    const imageId = imageIds[i]
    if (onProgress) {
      onProgress({ 
        percent: Math.round((i / total) * 100), 
        currentFile: `Generating preview for image ${imageId}...` 
      })
    }

    try {
      const tblIndex = imagesData[imageId]['GRP File']
      let targetPath = imagesTbl[tblIndex - 1]
      if (!targetPath) continue

      targetPath = targetPath.replace(/\\/g, '/').replace(/^SD\//i, '').replace(/^SD\\/i, '')
      if (!targetPath.toLowerCase().startsWith('unit/')) targetPath = 'unit/' + targetPath
      targetPath = targetPath.replace(/\.[^/.]+$/, "") + ".grp"

      const grpBuffer = await window.api.getDatapackFile(targetPath)
      if (!grpBuffer) continue

      const frameData = decodeGRP(grpBuffer, 0)
      if (!frameData) continue

      let minX = frameData.width, minY = frameData.height, maxX = 0, maxY = 0
      const pixels = frameData.data
      let hasPixels = false
      for (let y = 0; y < frameData.height; y++) {
        for (let x = 0; x < frameData.width; x++) {
          if (pixels[y * frameData.width + x] !== 0) {
            if (x < minX) minX = x; if (y < minY) minY = y
            if (x > maxX) maxX = x; if (y > maxY) maxY = y
            hasPixels = true
          }
        }
      }

      let cropWidth = frameData.width, cropHeight = frameData.height
      let offsetX = 0, offsetY = 0

      if (hasPixels) {
        cropWidth = maxX - minX + 1
        cropHeight = maxY - minY + 1
        offsetX = minX
        offsetY = minY
      }

      const paletteToUse = await loadPalette(targetPath, 'badlands')
      const drawFunction = imagesData[imageId]['Draw Function']

      const tempCanvas = document.createElement('canvas')
      tempCanvas.width = frameData.width
      tempCanvas.height = frameData.height
      renderToCanvas(tempCanvas.getContext('2d'), frameData, paletteToUse, PLAYER_COLORS['Orange'], drawFunction)

      canvas.width = Math.min(cropWidth, 128)
      canvas.height = Math.min(cropHeight, 128)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(tempCanvas, offsetX, offsetY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height)

      const dataUrl = canvas.toDataURL('image/webp', 0.8)
      await window.api.saveImagePreview(imageId, dataUrl)

    } catch (err) {
      console.warn(`[PreviewGen] Failed for image ${imageId}:`, err)
    }
  }

  if (onProgress) onProgress({ percent: 100, currentFile: 'All image previews generated.' })
}
