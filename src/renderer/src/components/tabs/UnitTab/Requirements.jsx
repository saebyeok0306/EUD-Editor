import React, { useMemo } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import RequirementEditor from '../../common/RequirementEditor'
import { getRequireData } from '../../../utils/datStore'
import '../../common/TabCommon.css'

function Card({ title, headerRight, children }) {
  return (
    <div className="info-card">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-title">{title}</span>
        {headerRight && <div>{headerRight}</div>}
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

function getWordCount(opcodes) {
  if (!opcodes || opcodes.length === 0) return 0
  
  let wordCount = 0
  let hasTerminator = false
  
  opcodes.forEach(op => {
    if ([2, 3, 4, 37].includes(op.opcode)) {
      wordCount += 2
    } else {
      wordCount += 1
    }
    if (op.opcode === 0) hasTerminator = true
  })
  
  // Custom arrays that have elements but no terminator implicitly get one
  if (!hasTerminator && opcodes.length > 0) {
    wordCount += 1
  }
  return wordCount
}

function Requirements({ selectedItem, currentProjectData, projectUnits, onUpdateProjectUnit, tblLanguage }) {
  const { t } = useI18n()

  if (selectedItem === null) return null

  // The original parsed require.dat data for display in read-only Default mode
  const defaultData = useMemo(() => {
    return getRequireData('units', selectedItem) || { mode: 'default', opcodes: [] }
  }, [selectedItem])

  // Project data (user edits) — always starts in 'default' if no user override
  const reqData = useMemo(() => {
    if (currentProjectData?.reqData) {
      return currentProjectData.reqData
    }
    // No saved edits → "default" mode, no custom opcodes (reads defaultData for display)
    return { mode: 'default', opcodes: [] }
  }, [currentProjectData?.reqData])

  const handleReqChange = (newReqData) => {
    onUpdateProjectUnit(selectedItem, 'reqData', newReqData)
  }

  const TOTAL_CAPACITY = 1096
  const usedCapacity = useMemo(() => {
    // Original untouched engine data consumes exactly 908 bytes conceptually in EUD Editor UI.
    let sum = 908

    for (let i = 0; i < 228; i++) {
      const data = projectUnits?.[i]?.reqData
      if (!data || data.mode === 'default') continue; // No delta.

      // Calculate Original Opcodes Count
      const defData = getRequireData('units', i)
      const originalOpcodes = defData ? defData.opcodes : []
      const O = getWordCount(originalOpcodes)

      // Calculate Custom Opcodes Count
      let C = 0;
      if (data.mode === 'always') C = 1; // 0xFFFF (1 word)
      else if (data.mode === 'disabled') C = 2; // 0xFF0B, 0xFFFF (2 words)
      else if (data.mode === 'custom') {
        const customOpcodes = data.opcodes || []
        // Unlike default, an empty custom array intrinsically gets 1 terminator word
        if (customOpcodes.length === 0) {
          C = 1;
        } else {
          C = getWordCount(customOpcodes)
        }
      }

      // Delta: (Custom_WordCount - Original_WordCount) * 2 bytes
      sum += (C - O) * 2
    }
    return sum
  }, [projectUnits])

  const isOverCapacity = usedCapacity > TOTAL_CAPACITY

  return (
    <div className="tab-detail-container">
      <div className="tab-detail-grid">
        <Card 
          title={t('unit.req.engine') || 'Engine Requirements'}
          headerRight={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '100px', 
                height: '8px', 
                backgroundColor: 'rgba(0, 0, 0, 0.3)', 
                border: '1px solid var(--ev-c-border, #666)',
                boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.5)',
                borderRadius: '4px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                    width: `${Math.min(100, Math.max(0, (usedCapacity / TOTAL_CAPACITY) * 100))}%`,
                    height: '100%',
                    backgroundColor: isOverCapacity ? 'var(--ev-c-red)' : 'var(--ev-c-brand)',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease, background-color 0.3s ease'
                }} />
              </div>
              <div style={{
                fontSize: '11px', 
                fontWeight: '600', 
                color: isOverCapacity ? 'var(--ev-c-red)' : 'var(--ev-c-text-2)',
                backgroundColor: isOverCapacity ? 'rgba(var(--ev-c-red-rgb, 255, 60, 60), 0.1)' : 'var(--ev-c-gray-4)',
                padding: '2px 6px',
                borderRadius: '4px',
                minWidth: '120px',
                textAlign: 'center'
              }}>
                {usedCapacity.toLocaleString()} / {TOTAL_CAPACITY.toLocaleString()} Bytes
              </div>
            </div>
          }
        >
          <RequirementEditor
        tblLanguage={tblLanguage}
            value={reqData}
            onChange={handleReqChange}
            defaultData={defaultData}
          />
        </Card>
      </div>
    </div>
  )
}

export default Requirements
