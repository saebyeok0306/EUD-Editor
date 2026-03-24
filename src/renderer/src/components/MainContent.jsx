import { useI18n } from '../i18n/i18nContext'
import UnitTab from './tabs/UnitTab/index'
import GenericTab from './tabs/GenericTab'

function MainContent({ selectedCategory, mapData, datReady }) {
  const { t } = useI18n()

  const renderTab = () => {
    switch (selectedCategory) {
      case 'Unit':      return <UnitTab mapData={mapData} datReady={datReady} />
      case 'Flingy':   return <GenericTab category="Flingy"    mapData={mapData} />
      case 'Sprite':   return <GenericTab category="Sprite"    mapData={mapData} />
      case 'Weapon':   return <GenericTab category="Weapon"    mapData={mapData} />
      case 'Image':    return <GenericTab category="Image"     mapData={mapData} />
      case 'Upgrade':  return <GenericTab category="Upgrade"   mapData={mapData} />
      case 'Tech':     return <GenericTab category="Tech"      mapData={mapData} />
      case 'Order':    return <GenericTab category="Order"     mapData={mapData} />
      case 'Text':     return <GenericTab category="Text"      mapData={mapData} />
      case 'Buttonset': return <GenericTab category="Buttonset" mapData={mapData} />
      default: return <div style={{ padding: '20px' }}>{t('content.unknownCategory')}</div>
    }
  }

  const title = t('content.editorTitle', { category: t(`category.${selectedCategory}`) })

  return (
    <div className="main-content">
      <div className="content-header">
        <h2>{title}</h2>
      </div>
      {renderTab()}
    </div>
  )
}

export default MainContent
