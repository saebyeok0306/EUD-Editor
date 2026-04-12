import React, { useMemo } from 'react'
import { useI18n } from '../../i18n/i18nContext'
import SearchableSelect from './SearchableSelect'
import ImageGraphic from './ImageGraphic'
import DatIcon from './DatIcon'
import { REQ_OPCODES } from '../../constants/reqOpcodes'
import { getTechdataData, getUpgradesData, getStatTxt, getUnitsData, getFlingyData, getSpritesData } from '../../utils/datStore'
import unitsText from '../../data/Units.txt?raw'

const UNIT_NAMES = unitsText.split('\n').map(line => line.trim()).filter(line => line.length > 0)

function getDatName(dataArray, index, statTxt, fallback) {
  if (!dataArray || !dataArray[index]) return fallback || `Unknown (${index})`
  const labelIdx = dataArray[index]['Label']
  if (labelIdx > 0 && statTxt && statTxt[labelIdx - 1]) return statTxt[labelIdx - 1]
  return fallback || `Unknown (${index})`
}

/** Small inline unit image thumbnail */
function _InlineImageThumb({ imageId }) {
  if (imageId === null || imageId === undefined) return null
  return (
    <div style={{
      width: 28, height: 28, flexShrink: 0,
      backgroundColor: 'var(--ev-c-graphic-bg)', borderRadius: '3px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      <ImageGraphic imageId={imageId} maxWidth={28} maxHeight={28} autoCrop animate={false} />
    </div>
  )
}

/** Small inline tech/upgrade DatIcon thumbnail */
function _InlineIconThumb({ frameIndex }) {
  if (frameIndex === null || frameIndex === undefined) return null
  return (
    <DatIcon
      frameIndex={frameIndex}
      size={28}
      style={{ flexShrink: 0, border: 'none', borderRadius: '3px' }}
    />
  )
}

const MODES = [
  { value: 'default', labelKey: 'req.mode.default', fallback: '기본값' },
  { value: 'always', labelKey: 'req.mode.always', fallback: '항상 허용' },
  { value: 'disabled', labelKey: 'req.mode.disabled', fallback: '사용 안함' },
  { value: 'custom', labelKey: 'req.mode.custom', fallback: '사용자 설정' },
]

// Styles shared between read-only and editable opcode rows
const ROW_BASE = {
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '6px',
  border: '1px solid var(--ev-c-divider)',
  // NOTE: no overflow:hidden here — that would clip SearchableSelect dropdowns.
  // Instead, first-child and last-child get the matching border-radius.
}

const ROW_HEADER = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '6px 10px',
  backgroundColor: 'var(--ev-c-gray-3)',
  minHeight: '34px',
  borderRadius: '6px 6px 0 0',   // round top corners
}

const ROW_HEADER_ONLY = {
  // used when there is NO param row below — round all corners
  borderRadius: '6px',
}

const ROW_PARAM = {
  padding: '6px 10px',
  backgroundColor: 'var(--ev-c-gray-5, var(--ev-c-bg))',
  borderTop: '1px solid var(--ev-c-divider)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  borderRadius: '0 0 6px 6px',   // round bottom corners
}

/** Map paramType to a readable label prefix */
const PARAM_LABEL = { unit: 'Unit', tech: 'Tech', upgrade: 'Upgrade' }

/* --- Shared Building Blocks --- */

function RowContainer({ isEnd, isOr, children }) {
  return (
    <div style={{ ...ROW_BASE, opacity: isEnd ? 0.6 : 1, borderColor: isOr ? 'var(--ev-c-brand)' : 'var(--ev-c-divider)' }}>
      {children}
    </div>
  )
}

function RowHeaderContainer({ isEnd, isOr, hasParam, children }) {
  return (
    <div style={{
      ...ROW_HEADER,
      ...(hasParam ? {} : ROW_HEADER_ONLY),
      backgroundColor: isEnd ? 'var(--ev-c-gray-4)' : isOr ? 'rgba(var(--ev-c-brand-rgb, 130,80,255),0.12)' : 'var(--ev-c-gray-3)'
    }}>
      {children}
    </div>
  )
}

function RowBadge({ index }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700', color: 'var(--ev-c-text-3)',
      minWidth: '18px', textAlign: 'center',
      backgroundColor: 'var(--ev-c-gray-4)', borderRadius: '3px', padding: '1px 4px', flexShrink: 0,
    }}>
      {index + 1}
    </span>
  )
}

function ParamLabel({ paramType }) {
  return (
    <span style={{
      fontSize: '11px', fontWeight: '600', color: 'var(--ev-c-text-3)',
      textTransform: 'uppercase', letterSpacing: '0.5px', minWidth: '58px', flexShrink: 0,
    }}>
      {PARAM_LABEL[paramType]}
    </span>
  )
}

/* ------------------------------ */

/** Read-only single opcode row (Default mode) */
function OpcodeReadonlyRow({ opItem, unitOptions, techOptions, upgradeOptions, index, requirementLanguage }) {
  const opDef = REQ_OPCODES.find(o => o.index === opItem.opcode)
  const opcodeLabel = opDef ? (requirementLanguage === 'ko' && opDef.text_ko ? opDef.text_ko : opDef.text) : `Opcode #${opItem.opcode}`
  const isEnd = opItem.opcode === 0
  const isOr = opItem.opcode === 1

  let paramOpt = null
  if (opDef?.paramType === 'unit') paramOpt = unitOptions[opItem.param] ?? null
  else if (opDef?.paramType === 'tech') paramOpt = techOptions[opItem.param] ?? null
  else if (opDef?.paramType === 'upgrade') paramOpt = upgradeOptions[opItem.param] ?? null

  const paramLabel = paramOpt?.label ?? (opDef?.paramType ? `${opDef.paramType} ${opItem.param}` : '')

  return (
    <RowContainer isEnd={isEnd} isOr={isOr}>
      <RowHeaderContainer isEnd={isEnd} isOr={isOr} hasParam={!!paramOpt}>
        <RowBadge index={index} />
        <span style={{ flex: 1, fontSize: '12px', color: 'var(--ev-c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {opcodeLabel}
        </span>
      </RowHeaderContainer>

      {/* Parameter row with icon */}
      {paramOpt && (
        <div style={ROW_PARAM}>
          <ParamLabel paramType={opDef.paramType} />
          {/* Unit: ImageGraphic thumbnail */}
          {opDef.paramType === 'unit' && paramOpt.imageId !== undefined && (
            <_InlineImageThumb imageId={paramOpt.imageId} />
          )}
          {/* Tech / Upgrade: DatIcon thumbnail */}
          {(opDef.paramType === 'tech' || opDef.paramType === 'upgrade') && paramOpt.icon !== null && paramOpt.icon !== undefined && (
            <_InlineIconThumb frameIndex={paramOpt.icon} />
          )}
          <span style={{ fontSize: '12px', color: 'var(--ev-c-text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {paramLabel}
          </span>
        </div>
      )}
    </RowContainer>
  )
}

/** Editable single opcode row (Custom mode) */
function OpcodeEditRow({ opItem, index, total, opcodeOptions, unitOptions, techOptions, upgradeOptions, onUpdate, onAdd, onRemove, t }) {
  const opDef = REQ_OPCODES.find(o => o.index === opItem.opcode)
  const isEnd = opItem.opcode === 0
  const isOr = opItem.opcode === 1

  let paramOptions = []
  if (opDef?.paramType === 'unit') paramOptions = unitOptions
  else if (opDef?.paramType === 'tech') paramOptions = techOptions
  else if (opDef?.paramType === 'upgrade') paramOptions = upgradeOptions

  return (
    <RowContainer isEnd={isEnd} isOr={isOr}>
      <RowHeaderContainer isEnd={isEnd} isOr={isOr} hasParam={!!opDef?.paramType}>
        <RowBadge index={index} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <SearchableSelect
            options={opcodeOptions}
            value={opItem.opcode}
            onChange={(val) => onUpdate(index, 'opcode', val)}
          />
        </div>
        {/* +/- buttons */}
        <ActionBtn onClick={() => onAdd(index)} title={t('req.btn.add') || '위에 추가'}>+</ActionBtn>
        <ActionBtn onClick={() => onRemove(index)} title={t('req.btn.remove') || '삭제'} disabled={total <= 1}>−</ActionBtn>
      </RowHeaderContainer>

      {/* Parameter row — only shown when opcode requires a param */}
      {opDef?.paramType && (
        <div style={ROW_PARAM}>
          <ParamLabel paramType={opDef.paramType} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <SearchableSelect
              options={paramOptions}
              value={opItem.param ?? 0}
              onChange={(val) => onUpdate(index, 'param', val)}
              showSelectedIcon={true}
            />
          </div>
        </div>
      )}
    </RowContainer>
  )
}

function ActionBtn({ onClick, children, title, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        width: '26px', height: '26px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'var(--ev-c-gray-2)',
        border: '1px solid var(--ev-c-divider)',
        borderRadius: '4px', cursor: disabled ? 'not-allowed' : 'pointer',
        color: 'var(--ev-c-text-2)', fontSize: '15px', fontWeight: '500',
        opacity: disabled ? 0.35 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function InfoBox({ children }) {
  return (
    <div style={{
      fontSize: '12px', color: 'var(--ev-c-text-3)',
      backgroundColor: 'var(--ev-c-gray-4)',
      border: '1px solid var(--ev-c-divider)',
      borderRadius: '5px',
      padding: '8px 12px',
      lineHeight: '1.5',
    }}>
      {children}
    </div>
  )
}

/**
 * RequirementEditor
 *
 * Props:
 *   value       – { mode: 'default'|'always'|'disabled'|'custom', opcodes: [...] }
 *   onChange    – (newValue) => void
 *   defaultData – The parsed require.dat entry (read-only display for Default mode)
 */
export default function RequirementEditor({ value, onChange, defaultData }) {
  const { t, requirementLanguage } = useI18n()
  const currentValue = value || { mode: 'default', opcodes: [] }

  const unitOptions = useMemo(() => {
    const units = getUnitsData() || []
    const flingy = getFlingyData() || []
    const sprites = getSpritesData() || []
    return UNIT_NAMES.map((name, i) => {
      // Resolve the chain: units→flingy→sprites→images
      const flingyId = units[i]?.['Graphics']
      const spriteId = flingy[flingyId]?.['Sprite']
      const imageId = sprites[spriteId]?.['Image File']
      return { value: i, label: `${name} (ID: ${i})`, imageId }
    })
  }, [])

  const techOptions = useMemo(() => {
    const data = getTechdataData() || []
    const statTxt = getStatTxt() || []
    return Array.from({ length: Math.max(data.length, 44) }, (_, i) => ({
      value: i,
      label: `${getDatName(data, i, statTxt, `Tech ${i}`)} (ID: ${i})`,
      icon: data[i]?.['Icon'] ?? null,
    }))
  }, [])

  const upgradeOptions = useMemo(() => {
    const data = getUpgradesData() || []
    const statTxt = getStatTxt() || []
    return Array.from({ length: Math.max(data.length, 61) }, (_, i) => ({
      value: i,
      label: `${getDatName(data, i, statTxt, `Upgrade ${i}`)} (ID: ${i})`,
      icon: data[i]?.['Icon'] ?? null,
    }))
  }, [])

  const opcodeOptions = useMemo(() =>
    // Exclude ==End of Sublist== (index 0) — it is managed automatically
    REQ_OPCODES.filter(op => op.index !== 0).map(op => ({ 
      value: op.index, 
      label: requirementLanguage === 'ko' && op.text_ko ? op.text_ko : op.text 
    }))
    , [])

  // Always guarantee the stored array ends with exactly one End-of-Sublist terminator
  const withTerminator = (opcodes) => {
    const stripped = (opcodes || []).filter(o => o.opcode !== 0)
    return [...stripped, { opcode: 0, param: undefined }]
  }

  // ---- Handlers ----
  const handleModeChange = (mode) => {
    let opcodes = currentValue.opcodes
    if (mode === 'custom') {
      const base = (opcodes && opcodes.filter(o => o.opcode !== 0).length > 0)
        ? opcodes
        : (defaultData?.opcodes?.length ? [...defaultData.opcodes] : [])
      opcodes = withTerminator(base)
    }
    onChange({ ...currentValue, mode, opcodes })
  }

  const handleUpdate = (index, field, val) => {
    // index refers to the *visible* list (End-of-Sublist excluded)
    const visibleOpcodes = (currentValue.opcodes || []).filter(o => o.opcode !== 0)
    const updated = { ...visibleOpcodes[index], [field]: val }
    if (field === 'opcode') {
      const opDef = REQ_OPCODES.find(o => o.index === val)
      if (!opDef?.paramType) delete updated.param
      else if (updated.param === undefined) updated.param = 0
    }
    visibleOpcodes[index] = updated
    onChange({ ...currentValue, opcodes: withTerminator(visibleOpcodes) })
  }

  const handleAdd = (afterIndex) => {
    const visibleOpcodes = (currentValue.opcodes || []).filter(o => o.opcode !== 0)
    visibleOpcodes.splice(afterIndex + 1, 0, { opcode: 1, param: undefined }) // default: Or
    onChange({ ...currentValue, opcodes: withTerminator(visibleOpcodes) })
  }

  const handleRemove = (index) => {
    const visibleOpcodes = (currentValue.opcodes || []).filter(o => o.opcode !== 0)
    if (visibleOpcodes.length <= 1) return // keep at least one entry
    visibleOpcodes.splice(index, 1)
    onChange({ ...currentValue, opcodes: withTerminator(visibleOpcodes) })
  }

  // ---- Derived ----
  // Filter End-of-Sublist (opcode 0) from displayed lists — it is always implicit
  const readonlyOpcodes = (defaultData?.opcodes || []).filter(o => o.opcode !== 0)
  const visibleCustomOpcodes = (currentValue.opcodes || []).filter(o => o.opcode !== 0)
  const mode = currentValue.mode

  return (
    <div className="req-editor-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontFamily: 'var(--ev-font-family, sans-serif)' }}>
      <style>{`
        .req-editor-wrapper [style*="monospace"],
        .req-editor-wrapper [style*="13px"] {
          font-family: inherit !important;
          font-size: 12px !important;
        }
      `}</style>

      {/* ── Mode buttons ── */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {MODES.map(m => {
          const active = mode === m.value
          return (
            <button
              key={m.value}
              onClick={() => handleModeChange(m.value)}
              style={{
                flex: 1, padding: '6px 4px', fontSize: '12px', fontWeight: active ? '600' : '400',
                backgroundColor: active ? 'var(--ev-c-brand)' : 'var(--ev-c-gray-3)',
                color: active ? '#fff' : 'var(--ev-c-text-2)',
                border: '1px solid',
                borderColor: active ? 'var(--ev-c-brand)' : 'var(--ev-c-divider)',
                borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {t(m.labelKey) || m.fallback}
            </button>
          )
        })}
      </div>

      {/* ── Default mode ── read-only from require.dat ── */}
      {mode === 'default' && (
        <>
          <InfoBox>{t('req.default.hint') || '기본값은 require.dat 원본 조건을 그대로 사용합니다. 수정하려면 "사용자 설정"을 선택하세요.'}</InfoBox>
          {readonlyOpcodes.length === 0
            ? <InfoBox>{t('req.default.empty') || '(이 항목에는 원본 요구사항이 없습니다)'}</InfoBox>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {readonlyOpcodes.map((op, i) => (
                <OpcodeReadonlyRow
                  key={i} index={i} opItem={op}
                  unitOptions={unitOptions} techOptions={techOptions} upgradeOptions={upgradeOptions}
                  requirementLanguage={requirementLanguage}
                />
              ))}
            </div>
          }
        </>
      )}

      {/* ── Always / Disabled mode ── status message only ── */}
      {(mode === 'always' || mode === 'disabled') && (
        <InfoBox>
          {mode === 'always'
            ? (t('req.always.hint') || '이 항목은 조건 없이 항상 허용됩니다.')
            : (t('req.disabled.hint') || '이 항목은 사용이 비활성화됩니다.')}
        </InfoBox>
      )}

      {/* ── Custom mode ── editable list ── */}
      {mode === 'custom' && (
        <>
          <InfoBox>{t('req.custom.desc') || '요구사항 목록을 직접 편집합니다.'}</InfoBox>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {visibleCustomOpcodes.map((op, i) => (
              <OpcodeEditRow
                key={i} index={i} opItem={op} total={visibleCustomOpcodes.length}
                opcodeOptions={opcodeOptions}
                unitOptions={unitOptions} techOptions={techOptions} upgradeOptions={upgradeOptions}
                onUpdate={handleUpdate} onAdd={handleAdd} onRemove={handleRemove}
                t={t}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
