<template>
  <div v-if="hasLocations" class="day-map-wrapper">
    <div ref="mapContainer" class="day-map" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  events: {
    type: Array,
    required: true,
  },
})

const mapContainer = ref(null)
let map = null
let markersLayer = null
let polylineLayer = null

const categoryColors = {
  transport: '#3A7BD5',
  food: '#5E8A48',
  culture: '#8B6AAE',
  rest: '#C4956A',
  shopping: '#D4785A',
  marathon: '#E8563A',
}

function getColor(category) {
  return categoryColors[category] || '#E8563A'
}

function getValidEvents() {
  return props.events.filter(
    (e) => e.lat != null && e.lng != null && !isNaN(e.lat) && !isNaN(e.lng),
  )
}

const hasLocations = computed(() => getValidEvents().length > 0)

function renderMarkers() {
  if (!map) return

  if (markersLayer) {
    map.removeLayer(markersLayer)
  }
  if (polylineLayer) {
    map.removeLayer(polylineLayer)
  }

  const validEvents = getValidEvents()
  if (validEvents.length === 0) return

  markersLayer = L.layerGroup()
  const latLngs = []

  validEvents.forEach((event) => {
    const latlng = [event.lat, event.lng]
    latLngs.push(latlng)

    const marker = L.circleMarker(latlng, {
      radius: 7,
      weight: 2,
      color: '#ffffff',
      fillColor: getColor(event.category),
      fillOpacity: 1,
    })

    marker.bindPopup(`<strong>${event.time || ''}</strong> ${event.title || ''}`)
    markersLayer.addLayer(marker)
  })

  markersLayer.addTo(map)

  if (latLngs.length >= 2) {
    polylineLayer = L.polyline(latLngs, {
      color: '#888888',
      weight: 2,
      dashArray: '6, 4',
      opacity: 0.6,
    }).addTo(map)
  }

  try {
    if (latLngs.length === 1) {
      map.setView(latLngs[0], 14)
    } else {
      const bounds = L.latLngBounds(latLngs)
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 })
      }
    }
  } catch {
    map.setView([33.59, 130.40], 12)
  }
}

onMounted(() => {
  if (!mapContainer.value) return
  try {
    map = L.map(mapContainer.value, {
      zoomControl: true,
      scrollWheelZoom: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map)

    renderMarkers()
  } catch {
    // Silently fail if map init errors
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

watch(
  () => props.events,
  () => {
    renderMarkers()
  },
  { deep: true },
)
</script>

<style scoped>
.day-map-wrapper {
  padding: 0 var(--radius-md, 12px);
  margin-bottom: var(--space-md, 16px);
}

.day-map {
  width: 100%;
  height: 200px;
  border-radius: var(--radius-md, 12px);
  z-index: 0;
  overflow: hidden;
}

@media (min-width: 768px) {
  .day-map {
    height: 280px;
  }
}
</style>
