import React, { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { useI18n } from '../../i18n/i18nContext'

export default function Changelog() {
  const { t } = useI18n()
  const [releases, setReleases] = useState([])
  const [loadingReleases, setLoadingReleases] = useState(false)
  const [errorReleases, setErrorReleases] = useState(null)

  useEffect(() => {
    if (releases.length === 0 && !loadingReleases) {
      setLoadingReleases(true)
      fetch('https://api.github.com/repos/saebyeok0306/EUD-Editor/releases')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch')
          return res.json()
        })
        .then(data => {
          setReleases(data)
          setLoadingReleases(false)
        })
        .catch(err => {
          console.error(err)
          setErrorReleases(err.message)
          setLoadingReleases(false)
        })
    }
  }, [])

  const handleOpenExternal = (url) => {
    if (window.electron && window.electron.shell) {
      window.electron.shell.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="settings-section">
      <h1 className="settings-section-title">{t('settings.changelog.title') || '업데이트 내역'}</h1>

      {loadingReleases && (
        <div className="changelog-loading">
          <p>{t('settings.changelog.loading') || '업데이트 내역을 불러오고 있습니다...'}</p>
        </div>
      )}

      {errorReleases && (
        <div className="changelog-error">
          <p>{t('settings.changelog.error') || '업데이트 내역을 불러오는데 실패했습니다.'}</p>
          <button className="settings-button" onClick={() => { setReleases([]); setErrorReleases(null); }}>
            {t('unit.btn.confirm') || 'Retry'}
          </button>
        </div>
      )}

      {!loadingReleases && !errorReleases && (
        <div className="changelog-container">
          {releases.map(release => (
            <div key={release.id} className="changelog-item">
              <div className="changelog-header">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <h3 className="changelog-title">{release.name || release.tag_name}</h3>
                  {release.name && <span className="changelog-tag">{release.tag_name}</span>}
                </div>
                <span className="changelog-date">
                  {new Date(release.published_at).toLocaleDateString()}
                </span>
              </div>
              <div className="changelog-body">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {release.body}
                </ReactMarkdown>
              </div>
            </div>
          ))}

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              className="github-link"
              onClick={() => handleOpenExternal('https://github.com/saebyeok0306/EUD-Editor/releases')}
              style={{ border: 'none', cursor: 'pointer' }}
            >
              {t('settings.changelog.viewOnGithub') || 'GitHub에서 보기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
