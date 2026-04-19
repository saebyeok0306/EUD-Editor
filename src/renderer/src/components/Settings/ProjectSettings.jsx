import React from 'react'
import { useI18n } from '../../i18n/i18nContext'

export default function ProjectSettings({ projectData, updateProjectData }) {
  const { t } = useI18n()

  const outputPath = projectData?.settings?.main?.outputPath || ''

  const handleSelectOutput = async () => {
    const options = {
      title: t('settings.selectOutputFolder') || 'Select Output Map Location',
      filters: [{ name: 'StarCraft Map', extensions: ['scx', 'scm'] }],
      defaultPath: outputPath || ''
    }
    const path = await window.api.showSaveDialog(options)
    if (path) {
      updateProjectData('settings', 'main', 'outputPath', path)
    }
  }

  const handleInputChange = (e) => {
    updateProjectData('settings', 'main', 'outputPath', e.target.value)
  }

  return (
    <div className="settings-section">
      <h3 className="settings-section-subtitle" style={{ color: 'var(--ev-c-text-2)', fontSize: '13px', marginBottom: '16px', borderBottom: '1px solid var(--ev-c-divider)', paddingBottom: '8px' }}>
        {t('settings.section.projectOptions') || '프로젝트 전용 설정'}
      </h3>

      
      <div className="settings-group">
        <label className="settings-label">{t('settings.tblLanguage') || 'TBL 언어 기준'}</label>
        <select
          className="settings-input"
          value={projectData?.settings?.main?.tblLanguage || 'eng'}
          onChange={(e) => updateProjectData('settings', 'main', 'tblLanguage', e.target.value)}
          style={{ width: '100%', marginBottom: '16px' }}
        >
          <option value="eng">{t('settings.tblLang.eng') || 'stat_txt.tbl (영문)'}</option>
          <option value="kor_eng">{t('settings.tblLang.korEng') || 'stat_txt_kor_eng.tbl (한글 음역)'}</option>
          <option value="kor_kor">{t('settings.tblLang.korKor') || 'stat_txt_kor_kor.tbl (한글 완역)'}</option>
        </select>
      </div>
      <div className="settings-group">
        <label className="settings-label">{t('settings.outputPath') || '빌드 결과 맵 경로 (.scx)'}</label>
        <div className="settings-input-row">
          <input
            type="text"
            className="settings-input"
            value={outputPath}
            onChange={handleInputChange}
            placeholder={t('settings.outputPathPlaceholder') || '예: C:\\Games\\Starcraft\\Maps\\Download'}
          />
          <button className="settings-button" onClick={handleSelectOutput}>
            {t('settings.browse') || '찾아보기'}
          </button>
        </div>
      </div>
    </div>
  )
}
