import { useI18n } from '../../../i18n/i18nContext'

function AIOrders() {
  const { t } = useI18n()
  return (
    <div className="properties-empty">
      <div className="properties-empty-text">
        {t('unit.tab.ai')} content will be here.
      </div>
    </div>
  )
}

export default AIOrders
