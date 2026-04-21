<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Car, Bus, ArrowLeft, MapPin } from 'lucide-vue-next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import itinerary from '../data/itinerary.json'

const route = useRoute()
const router = useRouter()

// --- Constants ---
const CATEGORY_COLORS = {
  transport: '#3A7BD5',
  food: '#5E8A48',
  culture: '#8B6AAE',
  rest: '#C4956A',
  shopping: '#D4785A',
  marathon: '#E8563A',
}

const days = itinerary.days

// --- Reactive State ---
const mapContainer = ref(null)
let map = null
let layerGroup = null

const selectedDayNum = ref(Number(route.query.day) || days[0]?.dayNum || 6)
const focusedEventIndex = ref(route.query.event != null ? Number(route.query.event) : null)

const isFocusMode = computed(() => focusedEventIndex.value != null)

const currentDay = computed(() =>
  days.find(d => d.dayNum === selectedDayNum.value) || days[0]
)

// Keep all events with their original index, mark which have coords
const allEvents = computed(() =>
  (currentDay.value?.events || []).map((e, i) => ({ ...e, _index: i }))
)

const eventsWithCoords = computed(() =>
  allEvents.value.filter(e => e.lat != null && e.lng != null)
)

// --- Haversine distance (km) ---
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Estimate transit times from distance
function estimateTransit(distKm) {
  const driveMin = Math.max(1, Math.round((distKm / 25) * 60))
  const transitMin = Math.max(2, Math.round((distKm / 15) * 60))
  return {
    drive: `${driveMin} 分`,
    transit: `${transitMin} 分`,
  }
}

// --- Focus mode segment data ---
const focusSegments = computed(() => {
  if (!isFocusMode.value) return []
  const events = eventsWithCoords.value
  const idx = events.findIndex(e => e._index === focusedEventIndex.value)
  if (idx < 0) return []

  const segments = []
  const current = events[idx]

  if (idx > 0) {
    const prev = events[idx - 1]
    const dist = haversine(prev.lat, prev.lng, current.lat, current.lng)
    const transit = prev.transitToNext || estimateTransit(dist)
    segments.push({
      type: 'prev-current',
      from: prev,
      to: current,
      distance: prev.distanceToNext ?? +dist.toFixed(1),
      transit,
    })
  }

  if (idx < events.length - 1) {
    const next = events[idx + 1]
    const dist = haversine(current.lat, current.lng, next.lat, next.lng)
    const transit = current.transitToNext || estimateTransit(dist)
    segments.push({
      type: 'current-next',
      from: current,
      to: next,
      distance: current.distanceToNext ?? +dist.toFixed(1),
      transit,
    })
  }

  return segments
})

// --- Map Initialization ---
function initMap() {
  if (map || !mapContainer.value) return

  try {
    map = L.map(mapContainer.value, {
      zoomControl: false,
      attributionControl: false,
    }).setView([33.59, 130.41], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.control.attribution({ position: 'bottomleft' }).addTo(map)

    layerGroup = L.layerGroup().addTo(map)
  } catch (err) {
    console.error('Map init failed:', err)
  }
}

// --- Render markers and lines ---
function renderMap() {
  if (!map || !layerGroup) return
  layerGroup.clearLayers()

  const events = eventsWithCoords.value
  if (events.length === 0) return

  if (isFocusMode.value) {
    renderFocusMode(events)
  } else {
    renderOverviewMode(events)
  }
}

function makeNumberedIcon(num, color, size = 28) {
  return L.divIcon({
    className: 'map-numbered-marker',
    html: `<div style="
      width: ${size}px; height: ${size}px; border-radius: 50%;
      background: ${color}; border: 2px solid #fff;
      color: #fff; font-size: ${size > 28 ? 14 : 12}px; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      font-family: system-ui, sans-serif;
    ">${num}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function renderOverviewMode(events) {
  // Numbered markers using divIcon — number = original event order (1-based)
  events.forEach((event) => {
    const color = CATEGORY_COLORS[event.category] || '#888'
    const icon = makeNumberedIcon(event._index + 1, color)

    const marker = L.marker([event.lat, event.lng], { icon })
    marker.bindTooltip(
      `<strong>${event.time}</strong> ${event.title}`,
      { direction: 'top', offset: [0, -14] }
    )
    marker.addTo(layerGroup)
  })

  // Dashed polyline connecting in order
  if (events.length > 1) {
    const latlngs = events.map(e => [e.lat, e.lng])
    L.polyline(latlngs, {
      color: '#888',
      weight: 2,
      dashArray: '6,4',
      opacity: 0.6,
    }).addTo(layerGroup)
  }

  fitToPoints(events)
}

function renderFocusMode(allEvents) {
  const idx = allEvents.findIndex(e => e._index === focusedEventIndex.value)
  if (idx < 0) return

  const current = allEvents[idx]
  const prev = idx > 0 ? allEvents[idx - 1] : null
  const next = idx < allEvents.length - 1 ? allEvents[idx + 1] : null

  const pointsToShow = [prev, current, next].filter(Boolean)

  // Draw segment lines
  if (prev) {
    L.polyline([[prev.lat, prev.lng], [current.lat, current.lng]], {
      color: '#888',
      weight: 2,
      dashArray: '6,4',
      opacity: 0.6,
    }).addTo(layerGroup)
  }

  if (next) {
    L.polyline([[current.lat, current.lng], [next.lat, next.lng]], {
      color: '#888',
      weight: 2,
      dashArray: '6,4',
      opacity: 0.6,
    }).addTo(layerGroup)
  }

  // Markers — use numbered icons, current is larger
  const addFocusMarker = (event, isCurrent) => {
    const color = CATEGORY_COLORS[event.category] || '#888'
    const size = isCurrent ? 36 : 28
    const icon = makeNumberedIcon(event._index + 1, color, size)

    const marker = L.marker([event.lat, event.lng], { icon })
    marker.bindTooltip(`<strong>${event.time}</strong> ${event.title}`, {
      direction: 'top',
      offset: [0, -(size / 2)],
    })
    marker.addTo(layerGroup)

    // Pulsing ring for current event
    if (isCurrent) {
      const pulseIcon = L.divIcon({
        className: 'map-pulse-ring',
        html: `<div class="pulse-ring" style="
          --pulse-color: ${color};
        "></div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })
      L.marker([event.lat, event.lng], { icon: pulseIcon, interactive: false }).addTo(layerGroup)
    }
  }

  if (prev) addFocusMarker(prev, false)
  addFocusMarker(current, true)
  if (next) addFocusMarker(next, false)

  fitToPoints(pointsToShow)
}

function fitToPoints(events) {
  if (!map || events.length === 0) return

  try {
    if (events.length === 1) {
      map.setView([events[0].lat, events[0].lng], 15)
    } else {
      const bounds = L.latLngBounds(events.map(e => [e.lat, e.lng]))
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60] })
      }
    }
  } catch (err) {
    console.error('fitBounds failed:', err)
  }
}

// --- Navigation ---
function goToOverview() {
  router.replace({ path: '/map', query: { day: selectedDayNum.value } })
}

function selectDay(dayNum) {
  selectedDayNum.value = dayNum
  focusedEventIndex.value = null
  router.replace({ path: '/map', query: { day: dayNum } })
}

// --- Watchers ---
watch(
  () => route.query,
  (q) => {
    if (q.day != null) selectedDayNum.value = Number(q.day)
    focusedEventIndex.value = q.event != null ? Number(q.event) : null
  }
)

watch([selectedDayNum, focusedEventIndex, eventsWithCoords], () => {
  nextTick(renderMap)
})

// --- Lifecycle ---
onMounted(() => {
  nextTick(() => {
    initMap()
    renderMap()
  })
})

onBeforeUnmount(() => {
  if (map) {
    try {
      map.remove()
    } catch (err) {
      // silent cleanup
    }
    map = null
    layerGroup = null
  }
})

// Weekday helper
const weekdays = ['日', '月', '火', '水', '木', '金', '土']
function getWeekday(dateStr) {
  return weekdays[new Date(dateStr).getDay()]
}
</script>

<template>
  <div class="map-page">
    <!-- Day selector (overview mode) -->
    <div v-if="!isFocusMode" class="day-selector">
      <button
        v-for="day in days"
        :key="day.dayNum"
        class="day-btn"
        :class="{
          active: selectedDayNum === day.dayNum,
          marathon: day.theme === 'marathon',
        }"
        @click="selectDay(day.dayNum)"
      >
        <span class="day-btn-weekday">{{ getWeekday(day.date) }}</span>
        <span class="day-btn-num">{{ day.dayNum }}</span>
      </button>
    </div>

    <!-- Back button (focus mode) -->
    <button v-if="isFocusMode" class="back-btn" @click="goToOverview">
      <ArrowLeft :size="18" :stroke-width="2" />
      <span>Overview</span>
    </button>

    <!-- Focus mode info cards -->
    <div v-if="isFocusMode && focusSegments.length > 0" class="segment-cards">
      <div
        v-for="(seg, i) in focusSegments"
        :key="i"
        class="segment-card"
      >
        <div class="segment-label">
          {{ seg.from.title }}
          <span class="segment-arrow">&rarr;</span>
          {{ seg.to.title }}
        </div>
        <div class="segment-details">
          <span class="segment-detail">
            <Car :size="14" :stroke-width="2" />
            {{ seg.transit.drive }}
          </span>
          <span class="segment-divider">|</span>
          <span class="segment-detail">
            <Bus :size="14" :stroke-width="2" />
            {{ seg.transit.transit }}
          </span>
          <span class="segment-divider">|</span>
          <span class="segment-detail">
            <MapPin :size="14" :stroke-width="2" />
            {{ seg.distance }}km
          </span>
        </div>
      </div>
    </div>

    <!-- Map container -->
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<style scoped>
.map-page {
  position: relative;
  width: 100%;
  height: calc(100dvh - var(--nav-height) - var(--bottom-bar-height));
  display: flex;
  flex-direction: column;
}

/* --- Day Selector --- */
.day-selector {
  display: flex;
  gap: 6px;
  padding: var(--space-sm) var(--space-md);
  overflow-x: auto;
  scrollbar-width: none;
  background: var(--surface-base);
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  z-index: 10;
}

.day-selector::-webkit-scrollbar {
  display: none;
}

.day-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 44px;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.day-btn:active {
  transform: scale(0.93);
}

.day-btn.active {
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
  border-color: var(--border-subtle);
}

.day-btn.active.marathon {
  background: var(--accent-primary);
}

.day-btn-weekday {
  font-size: 0.6rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.day-btn.active .day-btn-weekday {
  color: var(--text-secondary);
}

.day-btn.active.marathon .day-btn-weekday {
  color: var(--text-inverse);
}

.day-btn-num {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 1.05rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.2;
}

.day-btn.active .day-btn-num {
  font-weight: 600;
  color: var(--accent-primary);
}

.day-btn.active.marathon .day-btn-num {
  color: var(--text-inverse);
}

.day-btn.marathon:not(.active) .day-btn-num {
  color: var(--accent-primary);
}

/* --- Back Button --- */
.back-btn {
  position: absolute;
  top: var(--space-sm);
  left: var(--space-sm);
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-card);
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.back-btn:hover {
  box-shadow: var(--shadow-card-hover);
}

.back-btn:active {
  transform: scale(0.95);
}

/* --- Segment Info Cards --- */
.segment-cards {
  position: absolute;
  top: 52px;
  left: var(--space-sm);
  right: var(--space-sm);
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.segment-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  box-shadow: var(--shadow-card);
}

.segment-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.segment-arrow {
  color: var(--text-tertiary);
  margin: 0 4px;
}

.segment-details {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
}

.segment-detail {
  display: flex;
  align-items: center;
  gap: 3px;
}

.segment-divider {
  color: var(--text-tertiary);
  font-weight: 300;
}

/* --- Map Container --- */
.map-container {
  flex: 1;
  min-height: 0;
  z-index: 1;
}

/* --- Pulse Animation (global within this component) --- */
:deep(.map-pulse-ring) {
  background: none !important;
  border: none !important;
}

:deep(.pulse-ring) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--pulse-color, #E8563A);
  animation: pulse-expand 1.8s ease-out infinite;
}

@keyframes pulse-expand {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

/* --- Override Leaflet numbered marker reset --- */
:deep(.map-numbered-marker) {
  background: none !important;
  border: none !important;
}
</style>
