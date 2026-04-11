import { useI18n } from '../i18n/i18nContext'
import Versions from './Versions'
import electronLogo from '../assets/electron.svg'

function StartScreen({ onCreateProject, onOpenProject, onOpenSettings }) {
  const { t } = useI18n()


  return (
    <div className="start-screen">
      <header className="start-header">
        <img alt="logo" className="logo" src={electronLogo} />
        <div className="start-title">
          <h1>Starcraft {t('start.subtitle')}</h1>
          <span>v1.0.0-alpha.1</span>
        </div>
      </header>

      <main className="start-content centered">

        <section className="quick-actions-section">
          <div className="section-label" style={{ marginBottom: '10px' }}>{t('start.quickActions')}</div>
          <div className="quick-actions-grid">
            <button className="action-card" onClick={onCreateProject}>
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div className="action-text">
                <h3>{t('start.newProject')}</h3>
                <p>{t('start.newProjectDesc')}</p>
              </div>
            </button>

            <button className="action-card" onClick={onOpenProject}>
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                  <path d="M8 7h6" /><path d="M8 11h8" />
                </svg>
              </div>
              <div className="action-text">
                <h3>{t('start.openProject')}</h3>
                <p>{t('start.openProjectDesc')}</p>
              </div>
            </button>



            <button className="action-card" onClick={onOpenSettings}>
              <div className="action-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="action-text">
                <h3>{t('start.settings')}</h3>
                <p>{t('start.settingsDesc')}</p>
              </div>
            </button>
          </div>

          <Versions />
        </section>
      </main>
    </div>
  )
}

export default StartScreen
