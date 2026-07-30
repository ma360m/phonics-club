export function getDisplayPreferencesInitScript() {
  return `
;(function () {
  try {
    var key = 'phonics-display-preferences'
    var stored = window.localStorage.getItem(key)
    var prefs = stored ? JSON.parse(stored) : {}
    var root = document.documentElement
    var theme = prefs.theme || 'phonics-classic'
    var accent = prefs.accentColor || 'phonics-red'
    root.dataset.pcTheme = theme
    root.dataset.pcAccent = accent
    root.dataset.pcTextSize = prefs.textSize || 'default'
    root.dataset.pcReadingWidth = prefs.readingWidth || 'normal'
    root.dataset.pcLineSpacing = prefs.lineSpacing || 'normal'
    root.dataset.pcLetterSpacing = prefs.letterSpacing || 'normal'
    root.dataset.pcFontMode = prefs.fontMode || 'default'
    root.dataset.pcMotion = prefs.motionMode || 'system'
    root.dataset.pcGreyscale = prefs.greyscaleEnabled ? 'true' : 'false'
    root.dataset.pcHighVisibility = prefs.highVisibilityEnabled ? 'true' : 'false'
    root.dataset.pcNegativeContrast = prefs.negativeContrastEnabled ? 'true' : 'false'
    root.dataset.pcLightBackground = prefs.lightBackgroundEnabled ? 'true' : 'false'
    root.dataset.pcHighlightLinks = prefs.highlightLinksEnabled ? 'true' : 'false'
    root.dataset.pcUnderlineLinks = prefs.underlineLinksEnabled ? 'true' : 'false'
    root.dataset.pcStrongFocus = prefs.strongFocusEnabled ? 'true' : 'false'
    root.dataset.pcLargerButtons = prefs.largerButtonsEnabled ? 'true' : 'false'
    root.dataset.pcLargerTargets = prefs.largerTargetsEnabled ? 'true' : 'false'
    root.dataset.pcSimplified = prefs.simplifiedInterfaceEnabled ? 'true' : 'false'
    root.dataset.pcReduceDecorations = prefs.reduceDecorationsEnabled ? 'true' : 'false'
    root.dataset.pcReadingFocus = prefs.readingFocusEnabled ? 'true' : 'false'
    root.dataset.pcChildrenMode = prefs.childrenModeEnabled ? 'true' : 'false'
    if (!prefs.motionMode && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.dataset.pcMotion = 'reduced'
    }
  } catch (error) {}
})();`
}
