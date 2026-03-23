function Sidebar({ mapData, categories, selectedCategory, onSelectCategory, onCloseMap }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 title={mapData.fileName}>{mapData.fileName}</h3>
        <div className="sidebar-map-size">
          Size: {mapData.size[0]}x{mapData.size[1]}
        </div>
        <button className="sidebar-close-btn" onClick={onCloseMap}>
          Close Map
        </button>
      </div>
      <ul className="category-list">
        {categories.map(cat => (
          <li
            key={cat}
            className={selectedCategory === cat ? 'active' : ''}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Sidebar
