import React from 'react'
import { useI18n } from '../../../i18n/i18nContext'
import DatIcon from '../../common/DatIcon'
import SearchableSelect from '../../common/SearchableSelect'
import '../../common/TabCommon.css'

function Card({ title, children, style }) {
  return (
    <div className="info-card" style={style}>
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {children}
      </div>
    </div>
  )
}

function OrderField({ label, orderId, isMod, onChange, ordersData, options }) {
  const order = ordersData?.[orderId]
  // Highlight=0 means "no icon" in StarCraft convention
  const highlightFrame = (order?.['Highlight'] > 0) ? order['Highlight'] : null

  return (
    <div className="icon-field-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: '90px', flexShrink: 0, fontSize: '13px', textAlign: 'right', color: 'var(--ev-c-text-1)' }}>
        {label}
      </div>
      <input
        type="number"
        className={`modern-input ${isMod ? 'modified' : ''}`}
        style={{ width: '50px', flex: 'none', textAlign: 'center', padding: '6px 8px' }}
        value={orderId ?? 0}
        onChange={(e) => {
          const val = parseInt(e.target.value)
          if (!isNaN(val)) onChange(val)
        }}
      />
      <div style={{
        width: 36,
        height: 36,
        flexShrink: 0,
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: '4px',
        border: '1px solid var(--ev-c-divider)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <DatIcon 
          frameIndex={highlightFrame} 
          size={36} 
          style={{ border: 'none', borderRadius: 0, backgroundColor: 'transparent' }} 
        />
      </div>
      <div style={{ flex: 1 }}>
        <SearchableSelect
          className={isMod ? 'modified' : ''}
          options={options}
          value={orderId ?? 0}
          onChange={onChange}
          style={{
            height: '28px',
            backgroundColor: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--ev-c-divider)',
            borderRadius: '4px',
            padding: '0 8px',
          }}
        />
      </div>
    </div>
  )
}

function BitfieldCheckboxes({ value, labels, isMod, onChange }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      padding: '8px 12px',
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '6px',
      border: `1px solid ${isMod ? 'var(--ev-c-brand)' : 'var(--ev-c-gray-1)'}`
    }}>
      {labels.map((label, bitIndex) => {
        const checked = (value & (1 << bitIndex)) !== 0;
        return (
          <label key={bitIndex} className="checkbox-label" style={{
            fontSize: '12px',
            color: checked ? 'var(--ev-c-text-1)' : 'var(--ev-c-text-3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => {
                const bitMask = 1 << bitIndex;
                const newValue = e.target.checked ? (value | bitMask) : (value & ~bitMask);
                onChange(newValue >>> 0);
              }}
            />
            {label}
          </label>
        );
      })}
    </div>
  )
}

function AIOrders({
  selectedItem,
  currentProjectData,
  currentEudData,
  onUpdateProjectUnit,
  onResetProjectUnit,
  ordersData,
  statTxt
}) {
  const { t } = useI18n()

  if (selectedItem === null) return null

  const getVal = (field, eudField) => {
    if (currentProjectData?.[field] !== undefined) return currentProjectData[field]
    return currentEudData?.[eudField] ?? 0
  }

  const isMod = (field) => currentProjectData?.[field] !== undefined

  const compAiIdle = getVal('compAiIdle', 'Comp AI Idle')
  const humanAiIdle = getVal('humanAiIdle', 'Human AI Idle')
  const returnToIdle = getVal('returnToIdle', 'Return to Idle')
  const attackUnit = getVal('attackUnit', 'Attack Unit')
  const attackMove = getVal('attackMove', 'Attack Move')
  const rightClickAction = getVal('rightClickAction', 'Right-click Action')
  const aiInternal = getVal('aiInternal', 'AI Internal')

  const RIGHT_CLICK_OPTIONS = [
    { value: 0, label: t('order.rightClick.0', { defaultValue: '0  명령없음 / 자동 Attack' }) },
    { value: 1, label: t('order.rightClick.1', { defaultValue: '1  기본 이동 / 기본 Attack' }) },
    { value: 2, label: t('order.rightClick.2', { defaultValue: '2  기본 이동 / 없음 Attack' }) },
    { value: 3, label: t('order.rightClick.3', { defaultValue: '3  이동없음 / 기본 Attack' }) },
    { value: 4, label: t('order.rightClick.4', { defaultValue: '4  자원캐기' }) },
    { value: 5, label: t('order.rightClick.5', { defaultValue: '5  자원캐기 / 수리' }) },
    { value: 6, label: t('order.rightClick.6', { defaultValue: '6  없음' }) },
  ]

  const AI_INTERNAL_FLAGS = [
    t('ai.internal.suicide', { defaultValue: '"Strategic Suicide missions" AI를 무시한다.' }),
    t('ai.internal.guard', { defaultValue: '"Guard" 상태가 되지 않는다.' })
  ]

  const orderOptions = React.useMemo(() => {
    if (!ordersData) return []
    return ordersData.map((order, i) => {
      const lblId = order['Label']
      let name = `Order ${i}`
      if (statTxt && lblId > 0 && statTxt[lblId - 1]) {
        name = statTxt[lblId - 1]
      }
      const highlight = order['Highlight']
      return {
        value: i,
        label: `[${i.toString().padStart(3, '0')}] ${name}`,
        icon: (highlight > 0) ? highlight : null
      }
    })
  }, [ordersData, statTxt])

  return (
    <div className="tab-detail-container">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button
          className="btn-reset-tab"
          onClick={() => {
            if (confirm(t('unit.reset.confirmTab') || '현재 탭의 변경사항을 초기화하시겠습니까?')) {
              onResetProjectUnit(selectedItem, 'ai')
            }
          }}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--ev-c-divider)',
            borderRadius: '4px',
            cursor: 'pointer',
            color: 'var(--ev-c-text-2)'
          }}
        >
          {t('unit.reset.tab') || '탭 초기화'}
        </button>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <Card title={t('unit.ai.title', { defaultValue: '인공지능명령' })} style={{ marginTop: '0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <OrderField 
              label={t('unit.ai.compIdle', { defaultValue: '컴퓨터 기본' })} 
              orderId={compAiIdle} 
              isMod={isMod('compAiIdle')} 
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'compAiIdle', v)} 
              ordersData={ordersData} 
              options={orderOptions}
            />
            <OrderField 
              label={t('unit.ai.humanIdle', { defaultValue: '사람 기본' })} 
              orderId={humanAiIdle} 
              isMod={isMod('humanAiIdle')} 
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'humanAiIdle', v)} 
              ordersData={ordersData} 
              options={orderOptions}
            />
            <OrderField 
              label={t('unit.ai.returnToIdle', { defaultValue: '원상태로' })} 
              orderId={returnToIdle} 
              isMod={isMod('returnToIdle')} 
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'returnToIdle', v)} 
              ordersData={ordersData} 
              options={orderOptions}
            />
            <OrderField 
              label={t('unit.ai.attackUnit', { defaultValue: '유닛 공격' })} 
              orderId={attackUnit} 
              isMod={isMod('attackUnit')} 
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'attackUnit', v)} 
              ordersData={ordersData} 
              options={orderOptions}
            />
            <OrderField 
              label={t('unit.ai.attackMove', { defaultValue: '공격&이동' })} 
              orderId={attackMove} 
              isMod={isMod('attackMove')} 
              onChange={(v) => onUpdateProjectUnit(selectedItem, 'attackMove', v)} 
              ordersData={ordersData} 
              options={orderOptions}
            />

            <div className="icon-field-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '90px', flexShrink: 0, fontSize: '13px', textAlign: 'right', color: 'var(--ev-c-text-1)' }}>
                {t('unit.ai.rightClickAction', { defaultValue: '우클릭 행동' })}
              </div>
              <input
                type="number"
                className={`modern-input ${isMod('rightClickAction') ? 'modified' : ''}`}
                style={{ width: '50px', flex: 'none', textAlign: 'center', padding: '6px 8px' }}
                value={rightClickAction ?? 0}
                onChange={(e) => {
                  const val = parseInt(e.target.value)
                  if (!isNaN(val)) onUpdateProjectUnit(selectedItem, 'rightClickAction', val)
                }}
              />
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  className={isMod('rightClickAction') ? 'modified' : ''}
                  options={RIGHT_CLICK_OPTIONS}
                  value={rightClickAction ?? 0}
                  onChange={(v) => onUpdateProjectUnit(selectedItem, 'rightClickAction', v)}
                  style={{
                    height: '28px',
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--ev-c-divider)',
                    borderRadius: '4px',
                    padding: '0 8px',
                  }}
                />
              </div>
            </div>

            <div className="icon-field-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                <div style={{ width: '90px', flexShrink: 0, fontSize: '13px', textAlign: 'right', color: 'var(--ev-c-text-1)' }}>
                  {t('unit.ai.aiInternal', { defaultValue: '내부 인공지능' })}
                </div>
                <input
                  type="text"
                  className={`modern-input ${isMod('aiInternal') ? 'modified' : ''}`}
                  style={{ width: '50px', flex: 'none', textAlign: 'center', padding: '6px 8px', fontFamily: 'monospace' }}
                  value={aiInternal.toString(16).toUpperCase()}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 16)
                    if (!isNaN(val)) onUpdateProjectUnit(selectedItem, 'aiInternal', val)
                  }}
                />
              </div>
              <div style={{ paddingLeft: '100px', width: '100%', boxSizing: 'border-box' }}>
                <BitfieldCheckboxes
                  value={aiInternal}
                  labels={AI_INTERNAL_FLAGS}
                  isMod={isMod('aiInternal')}
                  onChange={(v) => onUpdateProjectUnit(selectedItem, 'aiInternal', v)}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AIOrders
