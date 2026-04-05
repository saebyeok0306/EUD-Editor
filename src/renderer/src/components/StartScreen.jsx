import { useI18n } from '../i18n/i18nContext'
import Versions from './Versions'
import electronLogo from '../assets/electron.svg'

function StartScreen({ onOpenScx }) {
  const { t } = useI18n()

  return (
    <div className="start-screen">
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="text">
        Starcraft <span className="react">{t('start.subtitle')}</span>
      </div>
      <p className="tip">
        {t('start.tip')}
      </p>
      <div className="actions">
        <div className="action">
          <a onClick={onOpenScx} style={{ cursor: 'pointer' }}>
            {t('start.openFile')}
          </a>
        </div>
      </div>
      <Versions />
    </div>
  )
}

export default StartScreen
