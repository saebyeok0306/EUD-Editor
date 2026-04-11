import React from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import { useNavigation } from '../../../contexts/NavigationContext'
import SearchableSelect from '../../common/SearchableSelect'
import '../../common/TabCommon.css'

function Card({ title, children, style, addon }) {
  return (
    <div className="info-card" style={style}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center' }}>
        <span className="card-title" style={{ flex: 1 }}>{title}</span>
        {addon && <div style={{ marginLeft: '10px' }}>{addon}</div>}
      </div>
      <div className="card-content">
        {children}
      </div>
    </div>
  )
}

function BitfieldCheckboxes({ value, labels, isMod, rows, onChange }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: `repeat(${rows}, auto)`,
      gridAutoFlow: 'column',
      gap: '4px 12px',
      padding: '8px',
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '6px',
      border: `1px solid ${isMod ? 'var(--ev-c-brand)' : 'var(--ev-c-divider)'}`
    }}>
      {labels.map((label, bitIndex) => {
        const checked = (value & (1 << bitIndex)) !== 0;
        return (
          <label key={bitIndex} className="checkbox-label" style={{
            fontSize: '12px',
            color: checked ? 'var(--ev-c-text-1)' : 'var(--ev-c-text-3)',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            opacity: 1
          }}>
            <input
              type="checkbox"
              checked={checked}
              disabled={false}
              onChange={(e) => {
                const bitMask = 1 << bitIndex;
                const newValue = e.target.checked ? (value | bitMask) : (value & ~bitMask);
                onChange(newValue >>> 0); // Convert to unsigned integer
              }}
            />
            {label}
          </label>
        );
      })}
    </div>
  )
}

function TextRow({ label, value, options, onChange, onNavigate, isMod, offset = 0 }) {
  return (
    <div className="icon-field-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 5px' }}>
      <div className="field-label" style={{ width: '45px', flexShrink: 0, fontSize: '13px' }}>{label}</div>
      <input
        type="number"
        className={`modern-input ${isMod ? 'modified' : ''}`}
        style={{ width: '60px', flex: 'none' }}
        value={(value ?? 0) + offset}
        onChange={(e) => onChange((parseInt(e.target.value) || 0) - offset)}
      />
      <SearchableSelect
        className={isMod ? 'modified' : ''}
        options={options}
        value={value ?? 0}
        onChange={onChange}
        onNavigate={onNavigate}
        style={{
          flex: 1,
          height: '30px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid var(--ev-c-divider)',
          borderRadius: '4px',
          padding: '0 8px',
          boxSizing: 'border-box'
        }}
      />
    </div>
  )
}

function EditTab({
  selectedItem,
  currentProjectData,
  currentMapData,
  currentEudData,
  onUpdateProjectUnit,
  onResetProjectUnit,
  statTxt
}) {
  const { t } = useI18n()
  const { navigateTo } = useNavigation()

  const statOptions = React.useMemo(() => {
    const opts = [{ value: 0, label: '[000] 없음 (None)' }]
    if (statTxt) {
      statTxt.forEach((txt, idx) => {
        opts.push({ value: idx + 1, label: `[${(idx + 1).toString().padStart(3, '0')}] ${txt}` })
      })
    }
    return opts
  }, [statTxt])

  // Rank uses stat_txt[rankVal + 1302] — build options where displayed index = raw value
  const rankOptions = React.useMemo(() => {
    if (!statTxt) return []
    const opts = []
    // Rank values are typically 0-based offsets; stat_txt entry is at (rankVal + 1302)
    const maxRank = Math.max(0, statTxt.length - 1302)
    for (let i = 0; i < maxRank; i++) {
      const statIdx = i + 1302
      const text = statTxt[statIdx] ?? `(${statIdx})`
      opts.push({ value: i, label: `[${(i + 1302).toString().padStart(4, '0')}] ${text}` })
    }
    return opts
  }, [statTxt])

  if (selectedItem === null) return null

  const getVal = (field, eudField) => {
    if (currentProjectData?.[field] !== undefined) return currentProjectData[field]
    if (currentEudData && eudField && currentEudData[eudField] !== undefined) return currentEudData[eudField]
    return 0
  }

  const isMod = (field) => currentProjectData?.[field] !== undefined

  // 1. StarEdit Ability Flags
  const abilityFlags = getVal('starEditAbilityFlags', 'Staredit Availability Flags')

  // 2. StarEdit Group Flags
  const groupFlags = getVal('starEditGroupFlags', 'Staredit Group Flags')

  // 3. Text Information (Rank, Label)
  const rankVal = getVal('rank', 'Rank/Sublabel')
  const labelVal = getVal('label', 'Unit Map String')

  // Translations
  const STAR_EDIT_ABILITY_FLAGS = [
    t('unit.ability.nonNeutral', { defaultValue: '비 자연물' }),
    t('unit.ability.unitPalette', { defaultValue: '유닛기제 & 팔레트' }),
    t('unit.ability.briefing', { defaultValue: '브리핑' }),
    t('unit.ability.playerSettings', { defaultValue: '플레이어 세팅' }),
    t('unit.ability.allRaces', { defaultValue: '모든 종족에' }),
    t('unit.ability.doodadState', { defaultValue: '두데드 상태설정' }),
    t('unit.ability.nonLocTriggers', { defaultValue: '비 로케이션 트리거' }),
    t('unit.ability.unitHeroSettings', { defaultValue: '유닛/영웅 설정' }),
    t('unit.ability.locTriggers', { defaultValue: '로케이션 트리거' }),
    t('unit.ability.broodWar', { defaultValue: '브루드워' }),
    t('unit.ability.unused1', { defaultValue: '사용안됨 1' }),
    t('unit.ability.unused2', { defaultValue: '사용안됨 2' }),
    t('unit.ability.unused3', { defaultValue: '사용안됨 3' }),
    t('unit.ability.unused4', { defaultValue: '사용안됨 4' }),
    t('unit.ability.unused5', { defaultValue: '사용안됨 5' }),
    t('unit.ability.unused6', { defaultValue: '사용안됨 6' })
  ]

  const STAR_EDIT_GROUP_FLAGS = [
    t('unit.group.zerg', { defaultValue: '저그' }),
    t('unit.group.terran', { defaultValue: '테란' }),
    t('unit.group.protoss', { defaultValue: '프로토스' }),
    t('unit.group.men', { defaultValue: '유닛(Men)' }),
    t('unit.group.buildings', { defaultValue: '건물' }),
    t('unit.group.factories', { defaultValue: '생산건물' }),
    t('unit.group.independent', { defaultValue: '독립유닛' }),
    t('unit.group.neutral', { defaultValue: '중립' })
  ]

  return (
    <div className="tab-detail-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button
          className="btn-reset-tab"
          onClick={() => {
            if (confirm(t('unit.reset.confirmTab') || '현재 탭의 변경사항을 초기화하시겠습니까?')) {
              onResetProjectUnit(selectedItem, 'edit')
            }
          }}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--ev-c-divider)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--ev-c-text-2)'
          }}
        >
          {t('unit.reset.tab') || '탭 초기화'}
        </button>
      </div>

      <div className="tab-detail-grid" style={{ gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: '20px' }}>

        {/* Left Column: Ability Flags */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card title={t('unit.edit.abilityTitle', { defaultValue: '스타에딧 어빌리티 플래그' })} style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--ev-c-text-1)' }}>{t('unit.edit.hexValue', { defaultValue: '설정값 (Hex)' })}</span>
              <input
                type="text"
                className={`modern-input ${isMod('starEditAbilityFlags') ? 'modified' : ''}`}
                value={(typeof abilityFlags === 'number' ? abilityFlags : 0).toString(16).toUpperCase()}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 16);
                  if (!isNaN(num)) onUpdateProjectUnit(selectedItem, 'starEditAbilityFlags', num);
                }}
                style={{ width: '80px', fontFamily: 'monospace' }}
              />
            </div>
            <BitfieldCheckboxes
              labels={STAR_EDIT_ABILITY_FLAGS}
              value={abilityFlags}
              isMod={isMod('starEditAbilityFlags')}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'starEditAbilityFlags', v)}
              rows={8}
            />
          </Card>
        </div>

        {/* Right Column: Group Flags */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Card title={t('unit.edit.groupTitle', { defaultValue: '그룹 플래그' })} style={{ flex: 1, minHeight: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--ev-c-text-1)' }}>{t('unit.edit.hexValue', { defaultValue: '설정값 (Hex)' })}</span>
              <input
                type="text"
                className={`modern-input ${isMod('starEditGroupFlags') ? 'modified' : ''}`}
                value={(typeof groupFlags === 'number' ? groupFlags : 0).toString(16).toUpperCase()}
                onChange={(e) => {
                  const num = parseInt(e.target.value, 16);
                  if (!isNaN(num)) onUpdateProjectUnit(selectedItem, 'starEditGroupFlags', num);
                }}
                style={{ width: '80px', fontFamily: 'monospace' }}
              />
            </div>
            <BitfieldCheckboxes
              labels={STAR_EDIT_GROUP_FLAGS}
              value={groupFlags}
              isMod={isMod('starEditGroupFlags')}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'starEditGroupFlags', v)}
              rows={8}
            />
          </Card>
        </div>
      </div>

      {/* Bottom Section: Text Information */}
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column' }}>
        <Card title={t('unit.edit.textInfo', { defaultValue: '문자 정보' })}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '600px' }}>
            <TextRow
              label={t('unit.edit.rank', { defaultValue: '계급' })}
              value={rankVal}
              options={rankOptions}
              isMod={isMod('rank')}
              offset={1302}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'rank', v)}
              onNavigate={() => navigateTo('Text', rankVal + 1302)}
            />
            <TextRow
              label={t('unit.edit.name', { defaultValue: '이름' })}
              value={labelVal}
              options={statOptions}
              isMod={isMod('label')}
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'label', v)}
              onNavigate={() => navigateTo('Text', labelVal)}
            />
          </div>
        </Card>
      </div>

    </div>
  )
}

export default EditTab
