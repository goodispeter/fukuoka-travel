<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Bus, ArrowLeft, MapPin, ChevronDown, ChevronLeft, ChevronRight, TrainFront, Footprints } from 'lucide-vue-next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import itinerary from '../data/itinerary.json'
import { groupEventsByLocation } from '../composables/useLocationGroups'

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
const focusedGroupIndex = ref(route.query.group != null ? Number(route.query.group) : null)
const expandedSegment = ref(null)

const isFocusMode = computed(() => focusedGroupIndex.value != null)

const currentDay = computed(() =>
  days.find(d => d.dayNum === selectedDayNum.value) || days[0]
)

// Location groups for the current day
const locationGroups = computed(() => {
  const events = currentDay.value?.events || []
  return groupEventsByLocation(events)
})

// Groups with coordinates
const groupsWithCoords = computed(() =>
  locationGroups.value.filter(g => g.lat != null && g.lng != null)
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

// Estimate transit time from distance
function estimateTransit(distKm) {
  const transitMin = Math.max(2, Math.round((distKm / 15) * 60))
  return { transit: `${transitMin} 分` }
}

// --- Focus mode segment data ---
const focusSegments = computed(() => {
  if (!isFocusMode.value) return []
  const groups = groupsWithCoords.value
  // Map focusedGroupIndex (from all groups) to groupsWithCoords index
  const targetGroup = locationGroups.value[focusedGroupIndex.value]
  if (!targetGroup) return []
  const idx = groups.findIndex(g => g.id === targetGroup.id)
  if (idx < 0) return []

  const segments = []
  const current = groups[idx]

  if (idx > 0) {
    const prev = groups[idx - 1]
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

  if (idx < groups.length - 1) {
    const next = groups[idx + 1]
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

// --- Transit detail helpers ---
function toggleTransitDetail(i) {
  expandedSegment.value = expandedSegment.value === i ? null : i
}

function getTransitDetail(seg) {
  return seg.transit?.transitDetail || null
}

function getModeIcon(mode) {
  const map = { metro: '🚇', bus: '🚌', jr: '🚃', train: '🚃', walk: '🚶' }
  return map[mode] || '🚌'
}

function formatDetailSteps(detail) {
  if (Array.isArray(detail)) return detail
  return [detail]
}

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

  const groups = groupsWithCoords.value
  if (groups.length === 0) return

  if (isFocusMode.value) {
    renderFocusMode(groups)
  } else {
    renderOverviewMode(groups)
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

function renderOverviewMode(groups) {
  groups.forEach((group, idx) => {
    const color = CATEGORY_COLORS[group.category] || '#888'
    const icon = makeNumberedIcon(idx + 1, color)

    const marker = L.marker([group.lat, group.lng], { icon })
    marker.bindTooltip(
      `<strong>${group.timeRange}</strong> ${group.name}`,
      { direction: 'top', offset: [0, -14] }
    )
    // Click to focus
    const allGroupIdx = locationGroups.value.findIndex(g => g.id === group.id)
    marker.on('click', () => {
      router.replace({ path: '/map', query: { day: selectedDayNum.value, group: allGroupIdx } })
    })
    marker.addTo(layerGroup)
  })

  // Dashed polyline connecting groups in order
  if (groups.length > 1) {
    const latlngs = groups.map(g => [g.lat, g.lng])
    L.polyline(latlngs, {
      color: '#888',
      weight: 2,
      dashArray: '6,4',
      opacity: 0.6,
    }).addTo(layerGroup)
  }

  fitToPoints(groups)
}

function renderFocusMode(allGroups) {
  const targetGroup = locationGroups.value[focusedGroupIndex.value]
  if (!targetGroup) return
  const idx = allGroups.findIndex(g => g.id === targetGroup.id)
  if (idx < 0) return

  const current = allGroups[idx]
  const prev = idx > 0 ? allGroups[idx - 1] : null
  const next = idx < allGroups.length - 1 ? allGroups[idx + 1] : null

  // Draw full route polyline (dimmed)
  if (allGroups.length > 1) {
    const latlngs = allGroups.map(g => [g.lat, g.lng])
    L.polyline(latlngs, {
      color: '#bbb',
      weight: 1.5,
      dashArray: '4,4',
      opacity: 0.4,
    }).addTo(layerGroup)
  }

  // Highlight segment lines for prev→current→next
  if (prev) {
    L.polyline([[prev.lat, prev.lng], [current.lat, current.lng]], {
      color: '#888',
      weight: 2.5,
      dashArray: '6,4',
      opacity: 0.7,
    }).addTo(layerGroup)
  }
  if (next) {
    L.polyline([[current.lat, current.lng], [next.lat, next.lng]], {
      color: '#888',
      weight: 2.5,
      dashArray: '6,4',
      opacity: 0.7,
    }).addTo(layerGroup)
  }

  // All markers — clickable, with different visual weight
  allGroups.forEach((group, gIdx) => {
    const isCurrent = group.id === current.id
    const isAdjacent = group.id === prev?.id || group.id === next?.id
    const color = CATEGORY_COLORS[group.category] || '#888'
    const size = isCurrent ? 36 : isAdjacent ? 28 : 22
    const opacity = isCurrent ? 1 : isAdjacent ? 0.85 : 0.5

    const icon = L.divIcon({
      className: 'map-numbered-marker',
      html: `<div style="
        width: ${size}px; height: ${size}px; border-radius: 50%;
        background: ${color}; border: 2px solid #fff;
        color: #fff; font-size: ${size > 28 ? 14 : size > 22 ? 12 : 10}px; font-weight: 600;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        font-family: system-ui, sans-serif;
        opacity: ${opacity};
      ">${gIdx + 1}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    })

    const marker = L.marker([group.lat, group.lng], { icon })
    marker.bindTooltip(`<strong>${group.timeRange}</strong> ${group.name}`, {
      direction: 'top',
      offset: [0, -(size / 2)],
    })

    // All non-current markers are clickable — navigate directly
    if (!isCurrent) {
      const allGroupIdx = locationGroups.value.findIndex(g => g.id === group.id)
      marker.on('click', () => {
        router.replace({ path: '/map', query: { day: selectedDayNum.value, group: allGroupIdx } })
      })
    }

    marker.addTo(layerGroup)

    // Pulsing ring for current
    if (isCurrent) {
      const pulseIcon = L.divIcon({
        className: 'map-pulse-ring',
        html: `<div class="pulse-ring" style="
          --pulse-color: ${color};
        "></div>`,
        iconSize: [48, 48],
        iconAnchor: [24, 24],
      })
      L.marker([group.lat, group.lng], { icon: pulseIcon, interactive: false }).addTo(layerGroup)
    }
  })

  // Center map on the focused point
  map.setView([current.lat, current.lng], map.getZoom() < 14 ? 15 : map.getZoom(), {
    animate: true,
    duration: 0.3,
  })
}

function fitToPoints(points) {
  if (!map || points.length === 0) return

  try {
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 15)
    } else {
      const bounds = L.latLngBounds(points.map(p => [p.lat, p.lng]))
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
  expandedSegment.value = null
  router.replace({ path: '/map', query: { day: selectedDayNum.value } })
}

function goToPrevGroup() {
  const groups = groupsWithCoords.value
  const targetGroup = locationGroups.value[focusedGroupIndex.value]
  if (!targetGroup) return
  const idx = groups.findIndex(g => g.id === targetGroup.id)
  if (idx <= 0) return
  const prevGroup = groups[idx - 1]
  const allGroupIdx = locationGroups.value.findIndex(g => g.id === prevGroup.id)
  router.replace({ path: '/map', query: { day: selectedDayNum.value, group: allGroupIdx } })
}

function goToNextGroup() {
  const groups = groupsWithCoords.value
  const targetGroup = locationGroups.value[focusedGroupIndex.value]
  if (!targetGroup) return
  const idx = groups.findIndex(g => g.id === targetGroup.id)
  if (idx < 0 || idx >= groups.length - 1) return
  const nextGroup = groups[idx + 1]
  const allGroupIdx = locationGroups.value.findIndex(g => g.id === nextGroup.id)
  router.replace({ path: '/map', query: { day: selectedDayNum.value, group: allGroupIdx } })
}

const hasPrevGroup = computed(() => {
  if (!isFocusMode.value) return false
  const groups = groupsWithCoords.value
  const targetGroup = locationGroups.value[focusedGroupIndex.value]
  if (!targetGroup) return false
  const idx = groups.findIndex(g => g.id === targetGroup.id)
  return idx > 0
})

const hasNextGroup = computed(() => {
  if (!isFocusMode.value) return false
  const groups = groupsWithCoords.value
  const targetGroup = locationGroups.value[focusedGroupIndex.value]
  if (!targetGroup) return false
  const idx = groups.findIndex(g => g.id === targetGroup.id)
  return idx >= 0 && idx < groups.length - 1
})

const focusedGroupName = computed(() => {
  if (!isFocusMode.value) return ''
  const targetGroup = locationGroups.value[focusedGroupIndex.value]
  return targetGroup?.name || ''
})

const focusedGroupCounter = computed(() => {
  if (!isFocusMode.value) return ''
  const groups = groupsWithCoords.value
  const targetGroup = locationGroups.value[focusedGroupIndex.value]
  if (!targetGroup) return ''
  const idx = groups.findIndex(g => g.id === targetGroup.id)
  if (idx < 0) return ''
  return `${idx + 1} / ${groups.length}`
})

function selectDay(dayNum) {
  selectedDayNum.value = dayNum
  focusedGroupIndex.value = null
  expandedSegment.value = null
  router.replace({ path: '/map', query: { day: dayNum } })
}

// --- Watchers ---
watch(
  () => route.query,
  (q) => {
    if (q.day != null) selectedDayNum.value = Number(q.day)
    focusedGroupIndex.value = q.group != null ? Number(q.group) : null
    expandedSegment.value = null
  }
)

watch([selectedDayNum, focusedGroupIndex, groupsWithCoords], () => {
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

    <!-- Focus mode top bar -->
    <div v-if="isFocusMode" class="focus-top-bar">
      <button class="back-btn" @click="goToOverview">
        <ArrowLeft :size="18" :stroke-width="2" />
      </button>
      <div class="focus-nav-center">
        <span class="focus-nav-name">{{ focusedGroupName }}</span>
        <span class="focus-nav-counter">{{ focusedGroupCounter }}</span>
      </div>
      <div class="focus-nav-arrows">
        <button class="focus-nav-btn" :disabled="!hasPrevGroup" @click="goToPrevGroup">
          <ChevronLeft :size="20" :stroke-width="2.5" />
        </button>
        <button class="focus-nav-btn" :disabled="!hasNextGroup" @click="goToNextGroup">
          <ChevronRight :size="20" :stroke-width="2.5" />
        </button>
      </div>
    </div>

    <!-- Focus mode info cards -->
    <div v-if="isFocusMode && focusSegments.length > 0" class="segment-cards">
      <div
        v-for="(seg, i) in focusSegments"
        :key="i"
        class="segment-card"
        :class="{ expanded: expandedSegment === i }"
        @click="toggleTransitDetail(i)"
      >
        <div class="segment-label">
          {{ seg.from.name }}
          <span class="segment-arrow">&rarr;</span>
          {{ seg.to.name }}
        </div>
        <div class="segment-details">
          <span class="segment-detail">
            <Bus :size="14" :stroke-width="2" />
            {{ seg.transit.transit }}
          </span>
          <span class="segment-divider">|</span>
          <span class="segment-detail">
            <MapPin :size="14" :stroke-width="2" />
            {{ seg.distance }}km
          </span>
          <ChevronDown
            v-if="getTransitDetail(seg)"
            :size="14"
            :stroke-width="2"
            class="segment-chevron"
            :class="{ rotated: expandedSegment === i }"
          />
        </div>

        <!-- Expandable transit detail -->
        <div v-if="expandedSegment === i && getTransitDetail(seg)" class="transit-detail">
          <div
            v-for="(step, j) in formatDetailSteps(getTransitDetail(seg))"
            :key="j"
            class="transit-step"
          >
            <span class="transit-mode-badge">{{ getModeIcon(step.mode) }}</span>
            <div class="transit-step-content">
              <div class="transit-step-line">
                <strong>{{ step.line || '徒歩' }}</strong>
              </div>
              <div v-if="step.from && step.to" class="transit-step-route">
                {{ step.from }} → {{ step.to }}
                <span v-if="step.stops" class="transit-stops">（{{ step.stops }} 站）</span>
              </div>
              <div class="transit-step-meta">
                <span v-if="step.cost" class="transit-cost">{{ step.cost }}</span>
                <span v-if="step.note" class="transit-note">{{ step.note }}</span>
              </div>
            </div>
          </div>
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

/* --- Focus Top Bar --- */
.focus-top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-sm);
  background: var(--surface-base);
  border-bottom: 1px solid var(--border-subtle);
}

/* --- Back Button --- */
.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 50%;
  box-shadow: var(--shadow-card);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.back-btn:hover {
  box-shadow: var(--shadow-card-hover);
}

.back-btn:active {
  transform: scale(0.95);
}

/* --- Focus Nav Center (name + counter) --- */
.focus-nav-center {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.focus-nav-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

.focus-nav-counter {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--text-tertiary);
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}

/* --- Focus Nav Arrows (prev/next) --- */
.focus-nav-arrows {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.focus-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
  flex-shrink: 0;
}

.focus-nav-btn:active:not(:disabled) {
  transform: scale(0.9);
  background: var(--surface-base);
}

.focus-nav-btn:disabled {
  opacity: 0.3;
  cursor: default;
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
  cursor: pointer;
  transition: box-shadow var(--duration-fast) var(--ease-out);
}

.segment-card:active {
  box-shadow: var(--shadow-card-hover);
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

.segment-chevron {
  margin-left: auto;
  color: var(--text-tertiary);
  transition: transform var(--duration-normal) var(--ease-out);
}

.segment-chevron.rotated {
  transform: rotate(180deg);
}

/* --- Transit Detail --- */
.transit-detail {
  margin-top: var(--space-sm);
  padding-top: var(--space-sm);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.transit-step {
  display: flex;
  gap: var(--space-sm);
  align-items: flex-start;
}

.transit-mode-badge {
  font-size: 1.1rem;
  width: 24px;
  text-align: center;
  flex-shrink: 0;
  padding-top: 1px;
}

.transit-step-content {
  flex: 1;
  min-width: 0;
}

.transit-step-line {
  font-size: 0.82rem;
  color: var(--text-primary);
}

.transit-step-route {
  font-size: 0.78rem;
  color: var(--text-secondary);
  margin-top: 1px;
}

.transit-stops {
  color: var(--text-tertiary);
}

.transit-step-meta {
  display: flex;
  gap: var(--space-sm);
  margin-top: 2px;
  font-size: 0.72rem;
}

.transit-cost {
  color: var(--accent-primary);
  font-weight: 500;
}

.transit-note {
  color: var(--text-tertiary);
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
