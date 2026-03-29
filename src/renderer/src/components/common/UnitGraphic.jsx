import React, { useState, useEffect } from 'react'
import { getUnitsData, getFlingyData, getSpritesData } from '../../utils/datStore'
import ImageGraphic from './ImageGraphic'

export default function UnitGraphic({ 
  unitId, 
  onDebugInfo, 
  animationName = 'Walking',
  ...props 
}) {
  const [imageId, setImageId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [flingyId, setFlingyId] = useState(null)

  useEffect(() => {
    if (unitId === null || unitId === undefined) {
      setImageId(null)
      return
    }

    try {
      setErrorMsg('')
      const unitsData = getUnitsData()
      if (!unitsData || !unitsData[unitId]) throw new Error('Unit data not found.')

      const fId = unitsData[unitId]['Graphics']
      const flingyData = getFlingyData()
      const spritesData = getSpritesData()

      if (!flingyData?.[fId] || !spritesData?.[flingyData[fId]['Sprite']]) {
        throw new Error('Data structure incomplete for unit: ' + unitId)
      }

      const spriteId = flingyData[fId]['Sprite']
      const resolvedImageId = spritesData[spriteId]['Image File']
      
      setFlingyId(fId)
      setImageId(resolvedImageId)

    } catch (err) {
      console.error('[UnitGraphic] Error loading unit graphic:', err)
      setErrorMsg(`[L${unitId}] ${err.message}`)
      setImageId(null)
    }
  }, [unitId])

  if (errorMsg) {
    return (
      <div style={{ ...props.style, width: props.maxWidth || 64, height: props.maxHeight || 64, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#333', color: '#ff5555', fontSize: '10px', textAlign: 'center', padding: '4px', overflow: 'hidden' }}>
        {errorMsg}
      </div>
    )
  }

  if (imageId === null) {
    return (
      <div style={{ ...props.style, width: props.maxWidth || 64, height: props.maxHeight || 64, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      </div>
    )
  }

  return (
    <ImageGraphic 
      imageId={imageId} 
      animationName={animationName}
      {...props}
      onDebugInfo={(info) => {
        if (onDebugInfo) {
          // Pass extended debug info upwards
          onDebugInfo({ ...info, flingyId, unitId })
        }
      }}
    />
  )
}
