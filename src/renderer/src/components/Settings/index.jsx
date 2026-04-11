import React, { useState } from 'react'
import { useI18n } from '../../i18n/i18nContext'
import General from './General'
import Changelog from './Changelog'

export default function Settings({ onClose }) {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState('general')

  return (
    <div className="settings-overlay">
      <div className="settings-sidebar">
        <div className="settings-sidebar-header">
          <h2>{t('settings.title') || '환경설정'}</h2>
        </div>
        <div 
          className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          {t('settings.tab.general') || '기본 설정'}
        </div>
        <div 
          className={`settings-tab ${activeTab === 'changelog' ? 'active' : ''}`}
          onClick={() => setActiveTab('changelog')}
        >
          {t('settings.tab.changelog') || '업데이트 내역'}
        </div>
      </div>

      <div className="settings-content">
        {activeTab === 'general' && <General />}
        {activeTab === 'changelog' && <Changelog />}
        
        <div className="settings-footer">
          <button className="settings-footer-btn close" onClick={onClose}>
            {t('settings.close') || '닫기'}
          </button>
        </div>
      </div>
    </div>
  )
}
