import { useI18n } from '../../../i18n/i18nContext'
import SearchableSelect from '../../common/SearchableSelect'
import useDatOptions from '../../../hooks/useDatOptions'
import '../../common/TabCommon.css'



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
  const sfxOptions = useDatOptions('sfx')

  if (selectedItem === null) return null

  const getVal = (field, eudField) => {
    if (currentProjectData?.[field] !== undefined) return currentProjectData[field]
    return currentEudData?.[eudField] ?? 0
  }

  const isMod = (field) => currentProjectData?.[field] !== undefined

  // Fields
  const readySound = getVal('readySound', 'Ready Sound')
  const yesSoundStart = getVal('yesSoundStart', 'Yes Sound Start')
  const yesSoundEnd = getVal('yesSoundEnd', 'Yes Sound End')
  const whatSoundStart = getVal('whatSoundStart', 'What Sound Start')
  const whatSoundEnd = getVal('whatSoundEnd', 'What Sound End')
  const pissedSoundStart = getVal('pissedSoundStart', 'Piss Sound Start')
  const pissedSoundEnd = getVal('pissedSoundEnd', 'Piss Sound End')

  return (
    <div className="tab-detail-container">
      <div className="info-card">
        <div className="card-header">
          <span className="card-title">{t('unit.tab.sound') || '사운드'}</span>
        </div>
        <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SoundRow
            label={t('unit.sound.ready') || '기다림'}
            value={readySound}
            modified={isMod('readySound')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'readySound', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.yesStart') || '대답(첫번째)'}
            value={yesSoundStart}
            modified={isMod('yesSoundStart')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'yesSoundStart', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.yesEnd') || '대답(마지막)'}
            value={yesSoundEnd}
            modified={isMod('yesSoundEnd')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'yesSoundEnd', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.whatStart') || '물어봄(첫번째)'}
            value={whatSoundStart}
            modified={isMod('whatSoundStart')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'whatSoundStart', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.whatEnd') || '물어봄(마지막)'}
            value={whatSoundEnd}
            modified={isMod('whatSoundEnd')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'whatSoundEnd', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.pissStart') || '짜증(첫번째)'}
            value={pissedSoundStart}
            modified={isMod('pissedSoundStart')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'pissedSoundStart', v)}
            sfxOptions={sfxOptions}
          />
          <SoundRow
            label={t('unit.sound.pissEnd') || '짜증(마지막)'}
            value={pissedSoundEnd}
            modified={isMod('pissedSoundEnd')}
            onChange={(v) => onUpdateProjectUnit(selectedItem, 'pissedSoundEnd', v)}
            sfxOptions={sfxOptions}
          />
        </div>
      </div>
    </div>
  )
}

export default SoundTab
