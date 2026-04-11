import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import MainContent from './MainContent'
import { useNavigation } from '../contexts/NavigationContext'

const CATEGORIES = [
  'Unit', 'Flingy', 'Sprite', 'Weapon', 'Image', 'Upgrade', 'Tech', 'Order', 'Text', 'Buttonset'
]

function EditorLayout({ 
  mapData, 
  projectData, 
  datReady, 
  onCloseMap, 
  onUpdateProjectUnit,
  onResetProjectUnit,
  onUpdateProjectData
}) {
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0])
  const { navigationRequest } = useNavigation()

  // React to cross-tab navigation requests
  useEffect(() => {
    if (navigationRequest && navigationRequest.category) {
      setSelectedCategory(navigationRequest.category)
    }
  }, [navigationRequest])

  return (
    <div className="editor-layout" style={{ display: 'flex', width: '100vw', height: 'calc(100vh - 32px)', backgroundColor: 'var(--color-background-soft)' }}>
      <Sidebar
        mapData={mapData}
        categories={CATEGORIES}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        onCloseMap={onCloseMap}
      />
      <MainContent 
        selectedCategory={selectedCategory} 
        mapData={mapData} 
        projectData={projectData}
        datReady={datReady} 
        onUpdateProjectUnit={onUpdateProjectUnit}
        onResetProjectUnit={onResetProjectUnit}
        onUpdateProjectData={onUpdateProjectData}
      />
    </div>
  )
}

export default EditorLayout
