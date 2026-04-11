import { useEffect } from 'react'
import { useNavigation } from '../contexts/NavigationContext'

/**
 * Hook for tabs to consume navigation requests.
 * When a navigation request targets this tab's category,
 * it sets the selectedItem and consumes the request.
 * 
 * @param {string} category - The category this tab handles (e.g. 'Sprite', 'Flingy')
 * @param {function} setSelectedItem - State setter for the tab's selected item
 */
export default function useNavigationTarget(category, setSelectedItem) {
  const { navigationRequest, consumeNavigation } = useNavigation()

  useEffect(() => {
    if (navigationRequest && navigationRequest.category === category && navigationRequest.itemId !== undefined) {
      setSelectedItem(navigationRequest.itemId)
      consumeNavigation()

      // Wait for React re-render, then scroll the active list item into view
      setTimeout(() => {
        requestAnimationFrame(() => {
          const activeItem = document.querySelector('.items-list-pane .list-item.active')
          if (activeItem) {
            activeItem.scrollIntoView({ block: 'center', behavior: 'smooth' })
          }
        })
      }, 50)
    }
  }, [navigationRequest, category, setSelectedItem, consumeNavigation])
}
