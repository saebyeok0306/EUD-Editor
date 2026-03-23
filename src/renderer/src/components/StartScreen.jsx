import Versions from './Versions'
import electronLogo from '../assets/electron.svg'

function StartScreen({ onOpenScx }) {
  return (
    <div className="start-screen">
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">EUD-Editor</div>
      <div className="text">
        Starcraft <span className="react">Map Editor</span>
      </div>
      <p className="tip">
        Click below to parse a Starcraft Map file.
      </p>
      <div className="actions">
        <div className="action">
          <a onClick={onOpenScx} style={{ cursor: 'pointer' }}>
            Open SCX/SCM File
          </a>
        </div>
      </div>
      <Versions />
    </div>
  )
}

export default StartScreen
