import { useI18n } from '../i18n/i18nContext'

function Sidebar({ mapData, categories, selectedCategory, onSelectCategory, onCloseMap }) {
  const { t } = useI18n()

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 title={mapData.fileName}>{mapData.fileName}</h3>
        <div className="sidebar-map-size">
          {t('sidebar.size')}: {mapData.size[0]}x{mapData.size[1]}
        </div>
        <button className="sidebar-close-btn" onClick={onCloseMap}>
          {t('sidebar.closeMap')}
        </button>
      </div>
      <ul className="category-list">
        {categories.map(cat => (
          <li
            key={cat}
            className={selectedCategory === cat ? 'active' : ''}
            onClick={() => onSelectCategory(cat)}
          >
            {t(`category.${cat}`)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Sidebar
