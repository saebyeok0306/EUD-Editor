import React from 'react'
import { useI18n } from '../../i18n/i18nContext'
import { useTheme, THEMES, DEFAULT_CUSTOM_COLORS } from '../../contexts/ThemeContext'

/**
 * Fixed color swatches for preview cards.
 * Values match the actual CSS variable declarations.
 */
const THEME_PREVIEWS = {
  dark:      { bg: '#1b1b1f', panel: '#282828', accent: '#6988e6', border: '#32363f' },
  darker:    { bg: '#282c34', panel: '#2c313a', accent: '#61afef', border: '#3a3f4b' },
  midnight:  { bg: '#1a1b26', panel: '#24283b', accent: '#7aa2f7', border: '#292e42' },
  vesper:    { bg: '#181825', panel: '#1e1e2e', accent: '#cba6f7', border: '#313244' },
  abyss:     { bg: '#232b38', panel: '#2e3440', accent: '#88c0d0', border: '#3b4252' },
  github:    { bg: '#ffffff', panel: '#f6f8fa', accent: '#0969da', border: '#d0d7de' },
  solarized: { bg: '#fdf6e3', panel: '#eee8d5', accent: '#268bd2', border: '#ddd7c3' },
  latte:     { bg: '#eff1f5', panel: '#e6e9ef', accent: '#8839ef', border: '#ccd0da' },
}

// ─── ThemeCard ──────────────────────────────────────────────
function ThemeCard({ themeId, isActive, onClick, label, overridePreview }) {
  const preview = overridePreview || THEME_PREVIEWS[themeId]
  if (!preview) return null

  return (
    <button
      id={`theme-card-${themeId}`}
      className={`theme-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
      style={{
        '--theme-bg': preview.bg,
        '--theme-panel': preview.panel,
        '--theme-accent': preview.accent,
        '--theme-border': preview.border,
      }}
    >
      <div className="theme-card-preview">
        <div className="theme-preview-titlebar"
          style={{ backgroundColor: preview.bg, borderBottom: `1px solid ${preview.border}` }}>
          <div className="theme-preview-dots">
            <span style={{ background: preview.border }} />
            <span style={{ background: preview.border }} />
            <span style={{ background: preview.accent }} />
          </div>
        </div>
        <div className="theme-preview-body" style={{ backgroundColor: preview.bg }}>
          <div className="theme-preview-sidebar"
            style={{ backgroundColor: preview.panel, borderRight: `1px solid ${preview.border}` }}>
            <div className="theme-preview-item" style={{ background: preview.accent, opacity: 0.9 }} />
            <div className="theme-preview-item" style={{ background: preview.border }} />
            <div className="theme-preview-item" style={{ background: preview.border }} />
          </div>
          <div className="theme-preview-content" style={{ backgroundColor: preview.bg }}>
            <div className="theme-preview-line long" style={{ background: preview.accent, opacity: 0.7 }} />
            <div className="theme-preview-line" style={{ background: preview.border }} />
            <div className="theme-preview-line short" style={{ background: preview.border }} />
          </div>
        </div>
      </div>

      <div className="theme-card-footer">
        <span className="theme-card-name">{label}</span>
        {isActive && (
          <span className="theme-card-check" style={{ color: preview.accent }}>✓</span>
        )}
      </div>
    </button>
  )
}

// ─── Custom color editor ────────────────────────────────────
const CUSTOM_KEYS = [
  { key: 'brand', labelKey: 'settings.theme.customBrand' },
  { key: 'bg',    labelKey: 'settings.theme.customBg' },
  { key: 'panel', labelKey: 'settings.theme.customPanel' },
  { key: 'text',  labelKey: 'settings.theme.customText' },
]

function CustomColorEditor({ customColors, updateCustomColor, resetCustomColors, t }) {
  return (
    <div className="custom-theme-editor">
      <div className="custom-editor-header">
        <span className="custom-editor-title">{t('settings.theme.customizeTitle')}</span>
        <button className="settings-button" onClick={resetCustomColors}>
          {t('settings.theme.customReset')}
        </button>
      </div>
      <div className="custom-color-grid">
        {CUSTOM_KEYS.map(({ key, labelKey }) => (
          <div key={key} className="custom-color-row">
            <label className="custom-color-label">{t(labelKey)}</label>
            <div className="custom-color-input-wrap">
              <input
                type="color"
                value={customColors[key]}
                onInput={e => updateCustomColor(key, e.target.value)}
                className="custom-color-swatch"
              />
              <input
                type="text"
                value={customColors[key]}
                onChange={e => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) {
                    updateCustomColor(key, e.target.value)
                  }
                }}
                className="settings-input custom-color-hex"
                maxLength={7}
                spellCheck={false}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────
export default function Theme() {
  const { t } = useI18n()
  const { theme, changeTheme, customColors, updateCustomColor, resetCustomColors } = useTheme()

  const darkThemes  = THEMES.filter(x => x.type === 'dark')
  const lightThemes = THEMES.filter(x => x.type === 'light')

  // Live preview for custom card
  const customPreview = {
    bg:     customColors.bg,
    panel:  customColors.panel,
    accent: customColors.brand,
    border: customColors.panel,
  }

  return (
    <div className="settings-section">
      <h1 className="settings-section-title">{t('settings.theme.title')}</h1>

      {/* ── Dark themes ── */}
      <div className="theme-section-label">{t('settings.theme.darkSection')}</div>
      <div className="theme-grid">
        {darkThemes.map(({ id, nameKey }) => (
          <ThemeCard
            key={id}
            themeId={id}
            isActive={theme === id}
            onClick={() => changeTheme(id)}
            label={t(nameKey)}
          />
        ))}
      </div>

      {/* ── Light themes ── */}
      <div className="theme-section-label" style={{ marginTop: 28 }}>
        {t('settings.theme.lightSection')}
      </div>
      <div className="theme-grid">
        {lightThemes.map(({ id, nameKey }) => (
          <ThemeCard
            key={id}
            themeId={id}
            isActive={theme === id}
            onClick={() => changeTheme(id)}
            label={t(nameKey)}
          />
        ))}
      </div>

      {/* ── Custom theme ── */}
      <div className="theme-section-label" style={{ marginTop: 28 }}>
        {t('settings.theme.customSection')}
      </div>
      <div className="theme-grid" style={{ marginBottom: 0 }}>
        <ThemeCard
          themeId="custom"
          isActive={theme === 'custom'}
          onClick={() => changeTheme('custom')}
          label={t('settings.theme.custom')}
          overridePreview={customPreview}
        />
      </div>

      {theme === 'custom' && (
        <CustomColorEditor
          customColors={customColors}
          updateCustomColor={updateCustomColor}
          resetCustomColors={resetCustomColors}
          t={t}
        />
      )}
    </div>
  )
}
