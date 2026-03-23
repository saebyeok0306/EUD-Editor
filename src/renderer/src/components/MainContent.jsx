import UnitTab from './tabs/UnitTab'
import GenericTab from './tabs/GenericTab'

function MainContent({ selectedCategory, mapData, datReady }) {
  const renderTab = () => {
    switch (selectedCategory) {
      case 'Unit':     return <UnitTab mapData={mapData} datReady={datReady} />
      case 'Flingy':  return <GenericTab category="Flingy"   mapData={mapData} />
      case 'Sprite':  return <GenericTab category="Sprite"   mapData={mapData} />
      case 'Weapon':  return <GenericTab category="Weapon"   mapData={mapData} />
      case 'Image':   return <GenericTab category="Image"    mapData={mapData} />
      case 'Upgrade': return <GenericTab category="Upgrade"  mapData={mapData} />
      case 'Tech':    return <GenericTab category="Tech"     mapData={mapData} />
      case 'Order':   return <GenericTab category="Order"    mapData={mapData} />
      case 'Text':    return <GenericTab category="Text"     mapData={mapData} />
      case 'Buttonset': return <GenericTab category="Buttonset" mapData={mapData} />
      default: return <div style={{ padding: '20px' }}>Unknown Category</div>
    }
  }

  return (
    <div className="main-content">
      <div className="content-header">
        <h2>{selectedCategory} Editor</h2>
      </div>
      {renderTab()}
    </div>
  )
}

export default MainContent
