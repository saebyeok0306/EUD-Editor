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
  const title = t('content.editorTitle', { category: t(`category.${selectedCategory}`) })

  return (
    <div className="main-content">
      <div className="content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>{title}</h2>
        <div id="header-actions-portal"></div>
      </div>
      <div style={{ display: selectedCategory === 'Unit' ? 'contents' : 'none' }}>
        <UnitTab 
          mapData={mapData} 
          projectData={projectData} 
          datReady={datReady} 
          onUpdateProjectUnit={onUpdateProjectUnit} 
          onResetProjectUnit={onResetProjectUnit}
        />
      </div>
      <div style={{ display: selectedCategory === 'Flingy' ? 'contents' : 'none' }}>
        <FlingyTab mapData={mapData} datReady={datReady} />
      </div>
      <div style={{ display: selectedCategory === 'Sprite' ? 'contents' : 'none' }}>
        <SpriteTab mapData={mapData} datReady={datReady} />
      </div>
      <div style={{ display: selectedCategory === 'Weapon' ? 'contents' : 'none' }}>
        <WeaponTab mapData={mapData} datReady={datReady} />
      </div>
      <div style={{ display: selectedCategory === 'Image' ? 'contents' : 'none' }}>
        <ImageTab mapData={mapData} projectData={projectData} datReady={datReady} onUpdateProjectImage={onUpdateProjectData} />
      </div>
      <div style={{ display: selectedCategory === 'Upgrade' ? 'contents' : 'none' }}>
        <UpgradeTab mapData={mapData} datReady={datReady} />
      </div>
      <div style={{ display: selectedCategory === 'Tech' ? 'contents' : 'none' }}>
        <TechTab mapData={mapData} datReady={datReady} />
      </div>
      <div style={{ display: selectedCategory === 'Order' ? 'contents' : 'none' }}>
        <OrderTab mapData={mapData} datReady={datReady} />
      </div>
      <div style={{ display: selectedCategory === 'Text' ? 'contents' : 'none' }}>
        <GenericTab category="Text" mapData={mapData} />
      </div>
      <div style={{ display: selectedCategory === 'Buttonset' ? 'contents' : 'none' }}>
        <GenericTab category="Buttonset" mapData={mapData} />
      </div>
      {!['Unit', 'Flingy', 'Sprite', 'Weapon', 'Image', 'Upgrade', 'Tech', 'Order', 'Text', 'Buttonset'].includes(selectedCategory) && (
        <div style={{ padding: '20px' }}>{t('content.unknownCategory')}</div>
      )}
    </div>
  )
}

export default MainContent
