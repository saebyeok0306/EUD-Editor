import { createContext, useContext, useState, useEffect } from 'react'
import ko from './ko'
import en from './en'

const translations = { ko, en }

const I18nContext = createContext(null)

const STORAGE_KEY = 'eud-editor-language'

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'ko'
  })

  // Listen for language changes from Electron menu bar
  useEffect(() => {
    if (!window.api?.onLanguageChanged) return

    const cleanup = window.api.onLanguageChanged((lang) => {
      setLanguage(lang)
      localStorage.setItem(STORAGE_KEY, lang)
    })

    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [])

  // Persist to localStorage whenever language changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
  }, [language])

  /**
   * Translate a key, with optional variable interpolation.
   * e.g. t('generic.empty.text', { category: 'Flingy' })
   */
  const t = (key, vars = {}) => {
    const dict = translations[language] || translations['ko']
    let str = dict[key] ?? key
    Object.entries(vars).forEach(([k, v]) => {
      str = str.replace(`{${k}}`, v)
    })
    return str
  }

  return (
    <I18nContext.Provider value={{ language, changeLanguage: setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
