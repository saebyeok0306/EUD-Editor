import React, { useState, useEffect } from 'react'
import { useI18n } from '../../i18n/i18nContext'

export default function General() {
  const { t, language, changeLanguage } = useI18n()
  const [settings, setSettings] = useState({
    starcraftPath: '',
    euddraftPath: '',
  })

  useEffect(() => {
    // Load initial settings
    window.api.getSettings().then(s => {
      setSettings(prev => ({ ...prev, ...s }))
    })
  }, [])

  const handleSaveSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    await window.api.saveSettings({ [key]: value })
  }

  const handleSelectStarcraftFolder = async () => {
    const path = await window.api.selectStarcraftFolder()
    if (path) {
      handleSaveSetting('starcraftPath', path)
    }
  }

  const handleSelectEudDraft = async () => {
    const filters = [{ name: 'euddraft Executable', extensions: ['exe'] }]
    const path = await window.api.selectStarcraftFile(filters, t('settings.selectEudDraft') || 'Select euddraft.exe')
    if (path) {
      handleSaveSetting('euddraftPath', path)
    }
  }

  return (
    <div className="settings-section">
      <h1 className="settings-section-title">{t('settings.general.title') || '기본 설정'}</h1>

      <div className="settings-group">
        <label className="settings-label">{t('settings.starcraftPath') || '스타크래프트 경로'}</label>
        <div className="settings-input-row">
          <input
            type="text"
            className="settings-input"
            value={settings.starcraftPath}
            readOnly
            placeholder={t('settings.starcraftPathPlaceholder') || '스타크래프트 폴더를 선택하세요'}
          />
          <button className="settings-button" onClick={handleSelectStarcraftFolder}>
            {t('settings.browse') || '찾아보기'}
          </button>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">{t('settings.euddraftPath') || 'euddraft 경로'}</label>
        <div className="settings-input-row">
          <input
            type="text"
            className="settings-input"
            value={settings.euddraftPath}
            readOnly
            placeholder={t('settings.euddraftPathPlaceholder') || 'euddraft.exe 파일을 선택하세요'}
          />
          <button className="settings-button" onClick={handleSelectEudDraft}>
            {t('settings.browse') || '찾아보기'}
          </button>
        </div>
      </div>

      <div className="settings-group">
        <label className="settings-label">{t('settings.language') || '언어(Language)'}</label>
        <select
          className="settings-input"
          style={{ width: '200px' }}
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
        >
          <option value="ko">한국어 (Korean)</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  )
}
