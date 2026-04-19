import React, { useState, useEffect, useMemo } from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import { getStatTxt } from '../../../utils/datStore'
import useNavigationTarget from '../../../hooks/useNavigationTarget'
import ListPane from '../../common/ListPane'

const MemoizedListItem = React.memo(({ item, isActive, onClick }) => (
  <div
    className={`list-item${isActive ? ' active' : ''}`}
    onClick={() => onClick(item.id)}
    style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', gap: '10px' }}
  >
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ev-c-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
        {item.name}
      </div>
      <div className="list-item-id" style={{ fontSize: '10px', color: 'var(--ev-c-text-3)', marginTop: '2px' }}>
        String ID: {item.id}
      </div>
    </div>
  </div>
))

function TextTab({ projectData, datReady }) {
  const { t } = useI18n()
  const [selectedItem, setSelectedItem] = useState(null)
  const [textList, setTextList] = useState([])

  useNavigationTarget('Text', setSelectedItem)

  const tblLanguage = projectData?.settings?.main?.tblLanguage || 'eng'

  useEffect(() => {
    if (!datReady) return
    const statTxt = getStatTxt(tblLanguage)
    if (!statTxt) return

    const names = []
    for (let i = 0; i < statTxt.length; i++) {
      names.push({
        id: i + 1,
        name: statTxt[i]
      })
    }
    setTextList(names)
  }, [datReady, tblLanguage])

  const selectedText = selectedItem !== null ? textList.find(t => t.id === selectedItem) : null

  return (
    <div className="content-body">
      <ListPane
        items={textList}
        selectedItem={selectedItem}
        renderItem={(item) => (
          <MemoizedListItem
            key={item.id}
            item={item}
            isActive={selectedItem === item.id}
            onClick={setSelectedItem}
          />
        )}
      />

      {/* Right Pane: Properties */}
      <div className="properties-pane">
        {selectedItem !== null && selectedText ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: 'var(--ev-c-text-1)', fontSize: '18px' }}>
              String ID {selectedText.id}
            </h3>
            
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--ev-c-text-2)', fontWeight: '500' }}>Text Content</label>
              <textarea 
                className="modern-input"
                readOnly
                value={selectedText.name}
                style={{ 
                  height: '200px', 
                  resize: 'none', 
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  fontFamily: 'monospace',
                  lineHeight: '1.4'
                }}
              />
              <div style={{ fontSize: '12px', color: 'var(--ev-c-text-3)', marginTop: '8px' }}>
                Note: This text view displays the contents of the chosen TBL file for reference. Direct editing of TBL is not supported in this view.
              </div>
            </div>
          </div>
        ) : (
          <div className="properties-empty">
            <div className="properties-empty-icon">📝</div>
            <div className="properties-empty-text">{t('generic.empty.text', { category: 'Text' })}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TextTab
