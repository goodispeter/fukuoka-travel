<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useItinerary } from '../composables/useItinerary'
import { MapPin, ExternalLink, Navigation } from 'lucide-vue-next'
import { resolveIcon } from '../utils/iconMap'

const props = defineProps({
  event: { type: Object, required: true },
  index: { type: Number, default: 0 },
  isMarathonDay: { type: Boolean, default: false },
  dayNum: { type: Number, default: 0 },
})

const router = useRouter()
const hasCoords = computed(() => props.event.lat != null && props.event.lng != null)

function openMap() {
  if (hasCoords.value) {
    router.push({ path: '/map', query: { day: props.dayNum, event: props.index } })
  }
}

const { getCategoryColor, getCategorySoftColor } = useItinerary()

const accentColor = computed(() => getCategoryColor(props.event.category))
const softColor = computed(() => getCategorySoftColor(props.event.category))

const iconComponent = computed(() => resolveIcon(props.event.icon))

const staggerDelay = computed(() => `${props.index * 40}ms`)
</script>

<template>
  <div
    class="timeline-item"
    :class="{ highlight: event.highlight }"
    :style="{ '--stagger': staggerDelay, '--accent': accentColor, '--accent-soft': softColor }"
  >
    <!-- Time column -->
    <div class="time-col">
      <span class="time-text font-mono">{{ event.time }}</span>
      <div class="timeline-line"></div>
    </div>

    <!-- Card -->
    <div class="card" :class="{ 'card-highlight': event.highlight }">
      <!-- Category Icon -->
      <div class="card-icon">
        <component :is="iconComponent" :size="18" :stroke-width="1.5" />
      </div>

      <div class="card-content">
        <h3 class="card-title">{{ event.title }}</h3>

        <div v-if="event.location" class="card-location">
          <MapPin :size="13" :stroke-width="1.5" />
          <span>{{ event.location }}</span>
          <a
            v-if="event.mapUrl"
            :href="event.mapUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="map-link"
            :aria-label="`在 Google Maps 開啟 ${event.location}`"
          >
            <ExternalLink :size="12" :stroke-width="1.5" />
          </a>
        </div>

        <p v-if="event.note" class="card-note">{{ event.note }}</p>
      </div>

      <!-- Map navigation button -->
      <button
        v-if="hasCoords"
        class="card-nav-btn"
        @click.stop="openMap"
        aria-label="在地圖上查看"
      >
        <Navigation :size="14" :stroke-width="1.5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.timeline-item {
  display: flex;
  gap: var(--space-md);
  animation: fadeSlideUp var(--duration-slow) var(--ease-out) var(--stagger) both;
}

@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 52px;
  flex-shrink: 0;
  padding-top: var(--space-md);
}

.time-text {
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
}

.timeline-line {
  width: 1px;
  flex: 1;
  background: var(--border-subtle);
  margin-top: var(--space-sm);
  min-height: 24px;
}

.card {
  flex: 1;
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--surface-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-subtle);
  margin-bottom: var(--space-sm);
  transition:
    box-shadow var(--duration-normal) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.card:active {
  transform: scale(0.98);
  box-shadow: var(--shadow-card);
}

.card-highlight {
  border-left: 3px solid var(--accent);
  background: var(--accent-soft);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--accent-soft);
  color: var(--accent);
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
}

.card-location {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--text-secondary);
}

.map-link {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  margin-left: 2px;
  color: var(--accent-transport);
  opacity: 0.7;
  transition: opacity var(--duration-fast);
  min-width: 24px;
  min-height: 24px;
  justify-content: center;
}

.map-link:hover,
.map-link:active {
  opacity: 1;
}

.card-note {
  margin-top: 6px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.card-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  color: var(--accent-transport);
  opacity: 0.5;
  flex-shrink: 0;
  align-self: center;
  transition: opacity var(--duration-fast), background var(--duration-fast);
}

.card-nav-btn:active {
  opacity: 1;
  background: var(--accent-transport-soft);
}

.highlight .time-text {
  color: var(--accent);
  font-weight: 600;
}
</style>
