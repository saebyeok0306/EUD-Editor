import React, { useState, useEffect } from 'react'
import { useI18n } from '../../i18n/i18nContext'
import { useSettings } from '../../contexts/SettingsContext'


export default function General() {
  const { t, language, changeLanguage, requirementLanguage, changeRequirementLanguage } = useI18n()
  const { playerColor, setPlayerColor } = useSettings()

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
      <h3 className="settings-section-subtitle" style={{ color: 'var(--ev-c-text-2)', fontSize: '13px', marginBottom: '16px', borderBottom: '1px solid var(--ev-c-divider)', paddingBottom: '8px' }}>
        {t('settings.section.environment') || '작업 환경'}
      </h3>

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

      <div className="settings-group" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <label className="settings-label" style={{ marginBottom: 0 }}>{t('settings.euddraftPath') || 'euddraft 경로'}</label>
          <span style={{ fontSize: '11px', color: 'var(--ev-c-text-3)', fontWeight: 'normal' }}>
            {t('settings.euddraftMinVersion')}
          </span>
        </div>
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

      <h3 className="settings-section-subtitle" style={{ color: 'var(--ev-c-text-2)', fontSize: '13px', marginBottom: '16px', borderBottom: '1px solid var(--ev-c-divider)', paddingBottom: '8px' }}>
        {t('settings.section.options') || '편집기 옵션'}
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
        <div className="settings-group" style={{ flex: '1', minWidth: '160px' }}>
          <label className="settings-label">{t('settings.language') || '언어 (UI)'}</label>
          <select
            className="settings-input"
            style={{ width: '100%' }}
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
          >
            <option value="ko">한국어 (Korean)</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="settings-group" style={{ flex: '1', minWidth: '160px' }}>
          <label className="settings-label">{t('settings.requirementLanguage') || '요구사항 번역'}</label>
          <select
            className="settings-input"
            style={{ width: '100%' }}
            value={requirementLanguage}
            onChange={(e) => changeRequirementLanguage(e.target.value)}
          >
            <option value="ko">한국어 (Korean)</option>
            <option value="en">English (Opcode)</option>
          </select>
        </div>

        <div className="settings-group" style={{ flex: '1', minWidth: '160px' }}>
          <label className="settings-label">{t('settings.playerColor') || '플레이어 색상'}</label>
          <select
            className="settings-input"
            style={{ width: '100%' }}
            value={playerColor}
            onChange={(e) => setPlayerColor(e.target.value)}
          >
            <option value="Red">{t('colors.red') || '빨강 (Red)'}</option>
            <option value="Blue">{t('colors.blue') || '파랑 (Blue)'}</option>
            <option value="Teal">{t('colors.teal') || '연두 (Teal)'}</option>
            <option value="Purple">{t('colors.purple') || '보라 (Purple)'}</option>
            <option value="Orange">{t('colors.orange') || '주황 (Orange)'}</option>
            <option value="Brown">{t('colors.brown') || '갈색 (Brown)'}</option>
            <option value="White">{t('colors.white') || '하얀색 (White)'}</option>
            <option value="Yellow">{t('colors.yellow') || '노란색 (Yellow)'}</option>
            <option value="Green">{t('colors.green') || '초록 (Green)'}</option>
            <option value="PaleYellow">{t('colors.paleYellow') || '밝은 노랑 (Pale Yellow)'}</option>
            <option value="Tan">{t('colors.tan') || '살구색 (Tan)'}</option>
            <option value="Azure">{t('colors.azure') || '남색 (Azure)'}</option>
          </select>
        </div>
      </div>
    </div>
  )
}
