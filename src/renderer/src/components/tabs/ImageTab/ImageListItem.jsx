import React from 'react'
import ImageGraphic from '../../common/ImageGraphic'

export function ImagePreview({ imageId, name, userDataPath }) {
  return <ImageGraphic imageId={imageId} playerColor="Red" maxWidth={44} maxHeight={44} autoCrop={true} animate={false} />
}

export const MemoizedListItem = React.memo(({ item, isActive, onClick, userDataPath }) => (
  <div
    className={`list-item${isActive ? ' active' : ''}`}
    onClick={() => onClick(item.id)}
    style={{ display: 'flex', alignItems: 'center', padding: '6px 10px', gap: '10px', height: '60px', boxSizing: 'border-box' }}
  >
    <div style={{
      width: '44px',
      height: '44px',
      flexShrink: 0,
      backgroundColor: 'var(--ev-c-graphic-bg)',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      border: '1px solid var(--ev-c-divider)'
    }}>
      <ImagePreview
        imageId={item.id}
        name={item.name}
        userDataPath={userDataPath}
      />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--ev-c-text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl', textAlign: 'left' }}>
        <bdi>{item.name}</bdi>
      </div>
      <div className="list-item-id" style={{ fontSize: '10px', color: 'var(--ev-c-text-3)', marginTop: '2px' }}>
        ID: {item.id.toString().padStart(3, '0')}
      </div>
    </div>
  </div>
))
