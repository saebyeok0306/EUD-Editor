import { useMemo } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import { getSfxdataData, getSfxdataTbl } from '../../../utils/datStore'
import SearchableSelect from '../../common/SearchableSelect'
import './UnitTab.css'

function useSfxOptions(t) {
  const sfxdata = getSfxdataData()
  const sfxdataTbl = getSfxdataTbl()

  return useMemo(() => {
    if (!sfxdata || !sfxdataTbl) return []

    const options = []
    options.push({ value: 0, label: t('unit.sound.none') })

    for (let i = 1; i < sfxdata.length; i++) {
      const sfx = sfxdata[i]
      if (!sfx) continue

      const sndFileIdx = sfx['Sound File']
      let stringName = ''
      if (sndFileIdx && sndFileIdx > 0 && sfxdataTbl) {
        stringName = sfxdataTbl[sndFileIdx - 1] || ''
      }
      if (!stringName) {
        stringName = 'Unknown'
      }

      // format: Terran\MARINE\TMaRdy00.WAV (275)
      // or (275) Terran\MARINE\TMaRdy00.WAV
      options.push({ value: i, label: `[${i.toString().padStart(3, '0')}] ${stringName}` })
    }
    return options
  }, [sfxdata, sfxdataTbl])
}

function SoundRow({ label, value, modified, onChange, sfxOptions }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 80px 1fr', gap: '8px', alignItems: 'center' }}>
      <div style={{ textAlign: 'right', fontSize: '13px', color: 'var(--ev-c-text-2)', paddingRight: '12px' }}>
        {label}
      </div>
      <div>
        <input
          type="number"
          className={`modern-input ${modified ? 'modified' : ''}`}
          value={value ?? 0}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          style={{ width: '100%' }}
        />
      </div>
      <div style={{ flex: 1 }}>
        <SearchableSelect
          className={`modern-input ${modified ? 'modified' : ''}`}
          options={sfxOptions}
          value={value ?? 0}
          onChange={(v) => onChange(v)}
          style={{
            width: '100%',
            height: '30px', /* Match modern-input size */
            backgroundColor: 'rgba(255,255,255,0.05)'
          }}
        />
      </div>
    </div>
  )
}

function SoundTab({
  selectedItem,
  currentProjectData,
  currentMapData,
  currentEudData,
  onUpdateProjectUnit,
  onResetProjectUnit
}) {
  const { t } = useI18n()
  const sfxOptions = useSfxOptions(t)

  if (selectedItem === null) return null

  const getVal = (field, eudField) => {
    if (currentProjectData?.[field] !== undefined) return currentProjectData[field]
    return currentEudData?.[eudField] ?? 0
  }

  const isMod = (field) => currentProjectData?.[field] !== undefined

  // Fields
  const ready = getVal('readySound', 'Ready Sound')
  const yesStart = getVal('yesSoundStart', 'Yes Sound Start')
  const yesEnd = getVal('yesSoundEnd', 'Yes Sound End')
  const whatStart = getVal('whatSoundStart', 'What Sound Start')
  const whatEnd = getVal('whatSoundEnd', 'What Sound End')
  const pissStart = getVal('pissSoundStart', 'Piss Sound Start')
  const pissEnd = getVal('pissSoundEnd', 'Piss Sound End')

  return (
    <div className="unit-detail-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button
          className="btn-reset-tab"
          onClick={() => {
            if (confirm(t('unit.reset.confirmTab') || '현재 탭의 변경사항을 초기화하시겠습니까?')) {
              onResetProjectUnit(selectedItem, 'sound')
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

      <div className="info-card">
        <div className="card-header">
          <span className="card-title">{t('unit.tab.sound') || '사운드'}</span>
        </div>
        <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SoundRow
            label={t('unit.sound.ready') || '기다림'}
            value={ready}
            modified={isMod('readySound')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'readySound', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.yesStart') || '대답(첫번째)'}
            value={yesStart}
            modified={isMod('yesSoundStart')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'yesSoundStart', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.yesEnd') || '대답(마지막)'}
            value={yesEnd}
            modified={isMod('yesSoundEnd')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'yesSoundEnd', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.whatStart') || '물어봄(첫번째)'}
            value={whatStart}
            modified={isMod('whatSoundStart')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'whatSoundStart', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.whatEnd') || '물어봄(마지막)'}
            value={whatEnd}
            modified={isMod('whatSoundEnd')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'whatSoundEnd', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.pissStart') || '짜증(첫번째)'}
            value={pissStart}
            modified={isMod('pissSoundStart')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'pissSoundStart', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.pissEnd') || '짜증(마지막)'}
            value={pissEnd}
            modified={isMod('pissSoundEnd')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'pissSoundEnd', v)}
            sfxOptions={sfxOptions}
          />
        </div>
      </div>
    </div>
  )
}

export default SoundTab
