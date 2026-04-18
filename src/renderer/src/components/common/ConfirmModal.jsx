import React, { useEffect, useRef } from 'react'

export default function ConfirmModal({ title = '알림', message, onConfirm, onCancel, confirmText = '확인', cancelText = '취소' }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (confirmRef.current) {
      confirmRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.15s ease-out'
    }}>
      <div style={{
        backgroundColor: 'var(--ev-c-black)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        width: '320px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.15s ease-out'
      }}>
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--ev-c-divider)',
          fontWeight: '600',
          fontSize: '13px',
          color: 'var(--ev-c-text-1)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          {title}
        </div>
        <div style={{
          padding: '20px 16px',
          fontSize: '13px',
          color: 'var(--ev-c-text-2)',
          lineHeight: '1.5',
          wordBreak: 'keep-all'
        }}>
          {message}
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '8px',
          padding: '12px 16px',
          background: 'var(--ev-c-black-soft)',
          borderTop: '1px solid var(--ev-c-divider)'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              backgroundColor: 'var(--ev-c-gray-3)',
              color: 'var(--ev-c-text-1)',
              border: '1px solid var(--ev-c-divider)',
              borderRadius: '4px',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'var(--ev-c-gray-2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'var(--ev-c-gray-3)';
            }}
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              backgroundColor: 'var(--ev-c-brand)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '1';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
