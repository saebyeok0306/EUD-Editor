import { createContext, useContext, useState, useEffect } from 'react'
import ko from './ko'
import en from './en'

const translations = { ko, en }

const I18nContext = createContext(null)

const STORAGE_KEY = 'eud-editor-language'
const REQ_STORAGE_KEY = 'eud-editor-req-language'

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'ko'
  })
  const [requirementLanguage, setRequirementLanguage] = useState(() => {
    return localStorage.getItem(REQ_STORAGE_KEY) || 'ko'
  })

  // 1. Load language from global settings on mount
  useEffect(() => {
    const loadSavedLanguage = async () => {
      if (window.api?.getSettings) {
        const settings = await window.api.getSettings()
        if (settings.language && settings.language !== language) {
          setLanguage(settings.language)
        }
        if (settings.requirementLanguage && settings.requirementLanguage !== requirementLanguage) {
          setRequirementLanguage(settings.requirementLanguage)
        }
      }
    }
    loadSavedLanguage()
  }, [])

  // 2. Listen for language changes from Electron menu bar
  useEffect(() => {
    if (!window.api?.onLanguageChanged) return

    const cleanup = window.api.onLanguageChanged((lang) => {
      setLanguage(lang)
    })

    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [])

  // 3. Persist to localStorage and global settings whenever language changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    localStorage.setItem(REQ_STORAGE_KEY, requirementLanguage)
    if (window.api?.saveSettings) {
      window.api.saveSettings({ language, requirementLanguage })
    }
  }, [language, requirementLanguage])

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
    <I18nContext.Provider value={{ 
      language, 
      changeLanguage: setLanguage, 
      requirementLanguage, 
      changeRequirementLanguage: setRequirementLanguage,
      t 
    }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
