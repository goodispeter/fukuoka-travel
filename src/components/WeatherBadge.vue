<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  date: {
    type: String,
    required: true,
  },
})

const weatherCache = new Map()

const loading = ref(false)
const weather = ref(null)

function mapWeatherCode(code) {
  if (code === 0) return { label: '晴', icon: 'sun' }
  if (code >= 1 && code <= 3) return { label: '多雲', icon: 'cloud' }
  if (code >= 45 && code <= 48) return { label: '霧', icon: 'fog' }
  if (code >= 51 && code <= 57) return { label: '小雨', icon: 'drizzle' }
  if (code >= 61 && code <= 67) return { label: '雨', icon: 'rain' }
  if (code >= 71 && code <= 77) return { label: '雪', icon: 'snow' }
  if (code >= 80 && code <= 82) return { label: '陣雨', icon: 'rain' }
  if (code >= 95 && code <= 99) return { label: '雷雨', icon: 'thunder' }
  return { label: '—', icon: 'cloud' }
}

async function fetchWeather(date) {
  if (weatherCache.has(date)) {
    weather.value = weatherCache.get(date)
    loading.value = false
    return
  }

  // Open-Meteo only forecasts ~16 days ahead — skip if too far
  const diff = (new Date(date) - new Date()) / (1000 * 60 * 60 * 24)
  if (diff > 14) {
    weatherCache.set(date, null)
    weather.value = null
    loading.value = false
    return
  }

  loading.value = true
  weather.value = null

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=33.5904&longitude=130.4017&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code&timezone=Asia/Tokyo&start_date=${date}&end_date=${date}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('fetch failed')
    const data = await res.json()

    const daily = data.daily
    if (!daily || !daily.temperature_2m_max?.length) throw new Error('no data')

    const code = daily.weather_code[0]
    const mapped = mapWeatherCode(code)

    const result = {
      icon: mapped.icon,
      label: mapped.label,
      high: Math.round(daily.temperature_2m_max[0]),
      low: Math.round(daily.temperature_2m_min[0]),
      precip: daily.precipitation_sum[0],
    }

    weatherCache.set(date, result)
    weather.value = result
  } catch {
    weatherCache.set(date, null)
    weather.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.date, (d) => {
  if (d) fetchWeather(d)
}, { immediate: true })
</script>

<template>
  <span v-if="loading" class="weather-badge skeleton" aria-label="Loading weather">&nbsp;</span>
  <span v-else-if="weather" class="weather-badge">
    <!-- Sun -->
    <svg v-if="weather.icon === 'sun'" class="weather-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="3.5" fill="none" stroke="var(--accent-primary, #e8a735)" stroke-width="1.5"/>
      <g stroke="var(--accent-primary, #e8a735)" stroke-width="1.2" stroke-linecap="round">
        <line x1="8" y1="0.5" x2="8" y2="2.5"/>
        <line x1="8" y1="13.5" x2="8" y2="15.5"/>
        <line x1="0.5" y1="8" x2="2.5" y2="8"/>
        <line x1="13.5" y1="8" x2="15.5" y2="8"/>
        <line x1="2.7" y1="2.7" x2="4.1" y2="4.1"/>
        <line x1="11.9" y1="11.9" x2="13.3" y2="13.3"/>
        <line x1="2.7" y1="13.3" x2="4.1" y2="11.9"/>
        <line x1="11.9" y1="4.1" x2="13.3" y2="2.7"/>
      </g>
    </svg>

    <!-- Cloud -->
    <svg v-else-if="weather.icon === 'cloud' || weather.icon === 'fog'" class="weather-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M4.5 12a3 3 0 0 1-.4-5.97 4 4 0 0 1 7.8 0A3 3 0 0 1 11.5 12z" fill="none" stroke="var(--text-secondary, #8b8fa3)" stroke-width="1.3" stroke-linejoin="round"/>
    </svg>

    <!-- Drizzle / Rain -->
    <svg v-else-if="weather.icon === 'drizzle' || weather.icon === 'rain'" class="weather-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M4 10a2.7 2.7 0 0 1-.3-5.37 3.6 3.6 0 0 1 7 0A2.7 2.7 0 0 1 10.5 10z" fill="none" stroke="var(--text-secondary, #8b8fa3)" stroke-width="1.2" stroke-linejoin="round"/>
      <g stroke="var(--accent-transport, #4a9eed)" stroke-width="1.2" stroke-linecap="round">
        <line x1="5" y1="12" x2="4.2" y2="14"/>
        <line x1="8" y1="12" x2="7.2" y2="14"/>
        <line v-if="weather.icon === 'rain'" x1="11" y1="12" x2="10.2" y2="14"/>
      </g>
    </svg>

    <!-- Snow -->
    <svg v-else-if="weather.icon === 'snow'" class="weather-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M4 10a2.7 2.7 0 0 1-.3-5.37 3.6 3.6 0 0 1 7 0A2.7 2.7 0 0 1 10.5 10z" fill="none" stroke="var(--text-secondary, #8b8fa3)" stroke-width="1.2" stroke-linejoin="round"/>
      <g fill="var(--text-secondary, #8b8fa3)">
        <circle cx="5" cy="12.5" r="0.8"/>
        <circle cx="8" cy="13.5" r="0.8"/>
        <circle cx="11" cy="12.5" r="0.8"/>
      </g>
    </svg>

    <!-- Thunder -->
    <svg v-else-if="weather.icon === 'thunder'" class="weather-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path d="M4 9a2.5 2.5 0 0 1-.3-4.97 3.3 3.3 0 0 1 6.5 0A2.5 2.5 0 0 1 10 9z" fill="none" stroke="var(--text-secondary, #8b8fa3)" stroke-width="1.2" stroke-linejoin="round"/>
      <polyline points="7.5,10 6,13 8.5,13 7,16" fill="none" stroke="var(--accent-primary, #e8a735)" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"/>
    </svg>

    <span class="weather-label">{{ weather.label }}</span>
    <span class="weather-temp">{{ weather.high }}°/{{ weather.low }}°</span>
    <span v-if="weather.precip > 0" class="weather-precip">{{ weather.precip }}mm</span>
  </span>
</template>

<style scoped>
.weather-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.78rem;
  font-family: var(--font-mono, monospace);
  color: var(--text-secondary, #8b8fa3);
  padding: 2px var(--space-sm, 6px);
  border-radius: var(--radius-full, 9999px);
  line-height: 1;
  white-space: nowrap;
  vertical-align: middle;
}

.weather-badge.skeleton {
  display: inline-block;
  width: 80px;
  height: 18px;
  background: var(--text-secondary, #8b8fa3);
  opacity: 0.15;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.25; }
}

.weather-icon {
  flex-shrink: 0;
}

.weather-label {
  margin-right: 2px;
}

.weather-temp {
  letter-spacing: -0.02em;
}

.weather-precip {
  color: var(--accent-transport, #4a9eed);
}
</style>
