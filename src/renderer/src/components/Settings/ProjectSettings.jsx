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
