import { ref } from 'vue'

const STORAGE_KEY = 'fukuoka-theme'
const VALID_PREFS = ['auto', 'light', 'dark']

const themePref = ref('auto')

function getSystemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(pref) {
  return pref === 'auto' ? getSystemTheme() : pref
}

function applyTheme(resolved) {
  document.documentElement.dataset.theme = resolved
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', resolved === 'dark' ? '#1A1814' : '#FAF7F2')
  }
}

export function initTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && VALID_PREFS.includes(saved)) {
      themePref.value = saved
    }
  } catch {}

  applyTheme(resolveTheme(themePref.value))

  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (themePref.value === 'auto') applyTheme(resolveTheme('auto'))
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else mq.addListener(onChange)
}

export function useTheme() {
  function setTheme(pref) {
    if (!VALID_PREFS.includes(pref)) return
    themePref.value = pref
    try {
      localStorage.setItem(STORAGE_KEY, pref)
    } catch {}
    applyTheme(resolveTheme(pref))
  }

  return { themePref, setTheme }
}
