import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

const STORAGE_KEY = 'eud-editor-theme'
const CUSTOM_STORAGE_KEY = 'eud-editor-custom-theme'

export const DEFAULT_CUSTOM_COLORS = {
  brand:  '#6988e6',
  bg:     '#1b1b1f',
  panel:  '#282828',
  border: '#32363f',
  text:   '#e8e8ef',
}

export const THEMES = [
  // Dark themes
  { id: 'dark',      nameKey: 'settings.theme.dark',      type: 'dark' },
  { id: 'darker',    nameKey: 'settings.theme.darker',    type: 'dark' },
  { id: 'midnight',  nameKey: 'settings.theme.midnight',  type: 'dark' },
  { id: 'vesper',    nameKey: 'settings.theme.vesper',    type: 'dark' },
  { id: 'abyss',     nameKey: 'settings.theme.abyss',     type: 'dark' },
  // Light themes
  { id: 'github',    nameKey: 'settings.theme.github',    type: 'light' },
  { id: 'solarized', nameKey: 'settings.theme.solarized', type: 'light' },
  { id: 'latte',     nameKey: 'settings.theme.latte',     type: 'light' },
  // Custom
  { id: 'custom',    nameKey: 'settings.theme.custom',    type: 'custom' },
]

// ─── Color utilities ────────────────────────────────────────
function hexToRgbStr(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r
    ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}`
    : '232, 232, 239'
}

function hexToArr(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [232, 232, 239]
}

function toHex(r, g, b) {
  return '#' + [r, g, b]
    .map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0'))
    .join('')
}

function lighten(hex, amt) {
  const [r, g, b] = hexToArr(hex)
  return toHex(r + amt, g + amt, b + amt)
}

function mix(h1, h2, t = 0.5) {
  const [r1, g1, b1] = hexToArr(h1)
  const [r2, g2, b2] = hexToArr(h2)
  return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t)
}

function isLight(hex) {
  const [r, g, b] = hexToArr(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

// ─── Theme application ──────────────────────────────────────
function applyTheme(themeId) {
  if (themeId === 'dark') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', themeId)
  }
}

function applyCustomColors(colors) {
  const el = document.documentElement
  const { brand, bg, panel, border, text } = colors
  const rgb = hexToRgbStr(text)

  const isLightTheme = isLight(bg)
  const sign = isLightTheme ? -1 : 1

  // 하위 호환성 (기존 저장 데이터에 border가 없을 경우)
  const customBorder = border || lighten(panel, 10 * sign)

  el.style.setProperty('--ev-c-brand', brand)
  el.style.setProperty('--ev-c-black', bg)
  el.style.setProperty('--ev-c-black-soft', panel)
  el.style.setProperty('--ev-c-black-mute', mix(bg, panel, 0.45))
  el.style.setProperty('--ev-c-gray-3', customBorder)
  el.style.setProperty('--ev-c-gray-2', lighten(customBorder, 10 * sign))
  el.style.setProperty('--ev-c-gray-1', lighten(customBorder, 20 * sign))
  el.style.setProperty('--ev-c-divider', customBorder)
  el.style.setProperty('--ev-c-divider-light', lighten(customBorder, 10 * sign))
  el.style.setProperty('--ev-c-text-1', `rgba(${rgb}, 0.90)`)
  el.style.setProperty('--ev-c-text-2', `rgba(${rgb}, 0.62)`)
  el.style.setProperty('--ev-c-text-3', `rgba(${rgb}, 0.38)`)
}

function clearCustomColors() {
  const el = document.documentElement
  ;[
    '--ev-c-brand', '--ev-c-black', '--ev-c-black-soft', '--ev-c-black-mute',
    '--ev-c-gray-3', '--ev-c-gray-2', '--ev-c-gray-1',
    '--ev-c-divider', '--ev-c-divider-light',
    '--ev-c-text-1', '--ev-c-text-2', '--ev-c-text-3',
  ].forEach(v => el.style.removeProperty(v))
}

function loadStoredCustomColors() {
  try {
    const s = localStorage.getItem(CUSTOM_STORAGE_KEY)
    return s ? JSON.parse(s) : DEFAULT_CUSTOM_COLORS
  } catch {
    return DEFAULT_CUSTOM_COLORS
  }
}

// ─── Provider ───────────────────────────────────────────────
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const t = localStorage.getItem(STORAGE_KEY) || 'dark'
    // Apply synchronously before first paint to avoid flash
    applyTheme(t)
    return t
  })

  const [customColors, setCustomColors] = useState(() => {
    const colors = loadStoredCustomColors()
    const savedTheme = localStorage.getItem(STORAGE_KEY) || 'dark'
    if (savedTheme === 'custom') {
      applyCustomColors(colors)
    }
    return colors
  })

  // Load from global settings on mount (overrides localStorage if different)
  useEffect(() => {
    const load = async () => {
      if (!window.api?.getSettings) return
      const settings = await window.api.getSettings()
      const savedTheme = settings.theme || 'dark'
      const savedCustom = settings.customTheme || DEFAULT_CUSTOM_COLORS

      setTheme(savedTheme)
      setCustomColors(savedCustom)
      applyTheme(savedTheme)
      if (savedTheme === 'custom') {
        applyCustomColors(savedCustom)
      } else {
        clearCustomColors()
      }
    }
    load()
  }, [])

  // Apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme)
    if (theme !== 'custom') {
      clearCustomColors()
    }
    localStorage.setItem(STORAGE_KEY, theme)
    window.api?.saveSettings?.({ theme })
  }, [theme])

  // Apply & persist custom colors whenever they change (only if custom is active)
  useEffect(() => {
    if (theme !== 'custom') return
    applyCustomColors(customColors)
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(customColors))
    window.api?.saveSettings?.({ customTheme: customColors })
  }, [customColors, theme])

  const changeTheme = (themeId) => setTheme(themeId)

  const updateCustomColor = (key, value) => {
    setCustomColors(prev => ({ ...prev, [key]: value }))
  }

  const resetCustomColors = () => setCustomColors(DEFAULT_CUSTOM_COLORS)

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, customColors, updateCustomColor, resetCustomColors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
