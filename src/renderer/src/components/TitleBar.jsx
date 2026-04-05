import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../i18n/i18nContext'

export default function TitleBar({ onOpenScx, onCloseMap, mapLoaded }) {
  const { t, language, changeLanguage } = useI18n()
  const [activeMenu, setActiveMenu] = useState(null)
  const menuRef = useRef(null)

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu)
  }

  const closeMenu = () => setActiveMenu(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMinimize = () => window.api.minimize()
  const handleMaximize = () => window.api.maximize()
  const handleClose = () => window.api.close()

  return (
    <div className="title-bar">
      <div className="title-bar-drag"></div>
      
      <div className="title-bar-content" ref={menuRef}>
        <div className="app-logo">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6988e6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>
          </svg>
        </div>

        <div className="menu-items">
          <div className={`menu-item ${activeMenu === 'file' ? 'active' : ''}`}>
            <button onClick={() => toggleMenu('file')}>File</button>
            {activeMenu === 'file' && (
              <div className="dropdown-menu">
                <div className="menu-row" onClick={() => { onOpenScx(); closeMenu(); }}>
                  <span>{t('start.openFile')}</span>
                  <span className="shortcut">Ctrl+O</span>
                </div>
                {mapLoaded && (
                  <div className="menu-row" onClick={() => { onCloseMap(); closeMenu(); }}>
                    <span>{t('sidebar.closeMap')}</span>
                  </div>
                )}
                <div className="menu-separator"></div>
                <div className="menu-row" onClick={() => { handleClose(); }}>
                  <span>Exit</span>
                </div>
              </div>
            )}
          </div>

          <div className={`menu-item ${activeMenu === 'language' ? 'active' : ''}`}>
            <button onClick={() => toggleMenu('language')}>Language</button>
            {activeMenu === 'language' && (
              <div className="dropdown-menu">
                <div className="menu-row" onClick={() => { changeLanguage('ko'); closeMenu(); }}>
                  <span className="check">{language === 'ko' ? '✓' : ''}</span>
                  <span>한국어</span>
                </div>
                <div className="menu-row" onClick={() => { changeLanguage('en'); closeMenu(); }}>
                  <span className="check">{language === 'en' ? '✓' : ''}</span>
                  <span>English</span>
                </div>
              </div>
            )}
          </div>

          <div className={`menu-item ${activeMenu === 'test' ? 'active' : ''}`}>
            <button onClick={() => toggleMenu('test')}>Test</button>
            {activeMenu === 'test' && (
              <div className="dropdown-menu">
                <div className="menu-row" onClick={() => { window.api.deleteSettings(); closeMenu(); }}>
                  <span>Delete settings.json</span>
                </div>
                <div className="menu-row" onClick={() => { window.api.deleteDatapack(); closeMenu(); }}>
                  <span>Delete casc.datapack</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="window-title">EUD Editor</div>

        <div className="window-controls">
          <button className="control-btn minimize" onClick={handleMinimize}>
            <svg width="10" height="1" viewBox="0 0 10 1"><line x1="0" y1="0.5" x2="10" y2="0.5" stroke="currentColor" strokeWidth="1"/></svg>
          </button>
          <button className="control-btn maximize" onClick={handleMaximize}>
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="0.5" y="0.5" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1"/></svg>
          </button>
          <button className="control-btn close" onClick={handleClose}>
            <svg width="10" height="10" viewBox="0 0 10 10"><line x1="0" y1="0" x2="10" y2="10" stroke="currentColor" strokeWidth="1"/><line x1="10" y1="0" x2="0" y2="10" stroke="currentColor" strokeWidth="1"/></svg>
          </button>
        </div>
      </div>
    </div>
  )
}
