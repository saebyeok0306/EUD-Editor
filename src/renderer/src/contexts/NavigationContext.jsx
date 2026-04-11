import { createContext, useContext, useState, useCallback } from 'react'

const NavigationContext = createContext(null)

export function NavigationProvider({ children }) {
  const [navigationRequest, setNavigationRequest] = useState(null)

  const navigateTo = useCallback((category, itemId) => {
    setNavigationRequest({ category, itemId, timestamp: Date.now() })
  }, [])

  const consumeNavigation = useCallback(() => {
    setNavigationRequest(null)
  }, [])

  return (
    <NavigationContext.Provider value={{ navigationRequest, navigateTo, consumeNavigation }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  return useContext(NavigationContext)
}
