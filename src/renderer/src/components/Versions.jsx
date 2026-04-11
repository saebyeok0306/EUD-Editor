import { useState, useEffect } from 'react'

function Versions() {
  const [versions] = useState(window.electron.process.versions)
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    window.api.getAppVersion().then(setAppVersion)
  }, [])

  return (
    <div className="versions-container">
      <div className="author-info">
        <p>Developed by <a href="#" onClick={(e) => { e.preventDefault(); window.api.openExternal('https://github.com/saebyeok0306/EUD-Editor'); }}>saebyeok0306</a></p>
        <p className="copyright">© 2026 saebyeok0306. All rights reserved.</p>
      </div>
    </div>
  )
}

export default Versions
