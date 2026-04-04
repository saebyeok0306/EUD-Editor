import { useI18n } from '../i18n/i18nContext'
import UnitTab from './tabs/UnitTab/index'
import ImageTab from './tabs/ImageTab/index'
import FlingyTab from './tabs/FlingyTab/index'
import SpriteTab from './tabs/SpriteTab/index'
import WeaponTab from './tabs/WeaponTab/index'
import UpgradeTab from './tabs/UpgradeTab/index'
import TechTab from './tabs/TechTab/index'
import OrderTab from './tabs/OrderTab/index'
import GenericTab from './tabs/GenericTab'

function MainContent({ 
  selectedCategory, 
  mapData, 
  projectData, 
  datReady, 
  onUpdateProjectUnit,
  onResetProjectUnit,
  onUpdateProjectData
}) {
  const { t } = useI18n()

  const renderTab = () => {
    switch (selectedCategory) {
      case 'Unit': return <UnitTab 
        mapData={mapData} 
        projectData={projectData} 
        datReady={datReady} 
        onUpdateProjectUnit={onUpdateProjectUnit} 
        onResetProjectUnit={onResetProjectUnit}
      />
      case 'Flingy': return <FlingyTab mapData={mapData} datReady={datReady} />
      case 'Sprite': return <SpriteTab mapData={mapData} datReady={datReady} />
      case 'Weapon': return <WeaponTab mapData={mapData} datReady={datReady} />
      case 'Image': return <ImageTab mapData={mapData} projectData={projectData} datReady={datReady} onUpdateProjectImage={onUpdateProjectData} />
      case 'Upgrade': return <UpgradeTab mapData={mapData} datReady={datReady} />
      case 'Tech': return <TechTab mapData={mapData} datReady={datReady} />
      case 'Order': return <OrderTab mapData={mapData} datReady={datReady} />
      case 'Text': return <GenericTab category="Text" mapData={mapData} />
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
