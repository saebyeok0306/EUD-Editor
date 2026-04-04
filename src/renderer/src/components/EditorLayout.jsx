import { useState } from 'react'
import Sidebar from './Sidebar'
import MainContent from './MainContent'

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

  return (
    <div className="editor-layout" style={{ display: 'flex', width: '100vw', height: '100vh', backgroundColor: 'var(--color-background-soft)' }}>
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
