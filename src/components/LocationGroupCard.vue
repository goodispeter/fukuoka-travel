<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useItinerary } from '../composables/useItinerary'
import { MapPin, ExternalLink, Navigation, ChevronDown } from 'lucide-vue-next'
import { resolveIcon } from '../utils/iconMap'

const props = defineProps({
  group: { type: Object, required: true },
  index: { type: Number, default: 0 },
  isMarathonDay: { type: Boolean, default: false },
  dayNum: { type: Number, default: 0 },
})

const router = useRouter()
const { getCategoryColor, getCategorySoftColor } = useItinerary()

const isExpanded = ref(false)
const hasMultipleEvents = computed(() => props.group.events.length > 1)

function toggleExpand() {
  if (hasMultipleEvents.value) {
    isExpanded.value = !isExpanded.value
  }
}

const hasCoords = computed(() => props.group.lat != null && props.group.lng != null)

function openMap() {
  if (hasCoords.value) {
    router.push({ path: '/map', query: { day: props.dayNum, group: props.index } })
  }
}

const accentColor = computed(() => getCategoryColor(props.group.category))
const softColor = computed(() => getCategorySoftColor(props.group.category))

// For single-event groups, show the event icon; for multi, show dominant category icon
const primaryIcon = computed(() => {
  if (props.group.events.length === 1) {
    return resolveIcon(props.group.events[0].icon)
  }
  return resolveIcon(props.group.events[0].icon)
})

const staggerDelay = computed(() => `${props.index * 50}ms`)
</script>

<template>
  <div
    class="location-group"
    :class="{ highlight: group.hasHighlight }"
    :style="{ '--stagger': staggerDelay, '--accent': accentColor, '--accent-soft': softColor }"
  >
    <!-- Time column -->
    <div class="time-col">
      <span class="time-text font-mono">{{ group.timeRange }}</span>
      <div class="timeline-line"></div>
    </div>

    <!-- Card -->
    <div class="card" :class="{ 'card-highlight': group.hasHighlight, expanded: isExpanded }">
      <!-- Header (always visible) -->
      <div class="card-header" @click="toggleExpand" :class="{ clickable: hasMultipleEvents }">
        <div class="card-icon">
          <component :is="primaryIcon" :size="18" :stroke-width="1.5" />
        </div>

        <div class="card-header-content">
          <div class="card-title-row">
            <h3 class="card-title">{{ group.name }}</h3>
            <span v-if="hasMultipleEvents" class="event-count-chip">
              {{ group.events.length }} 項活動
            </span>
          </div>

          <!-- Single event: show note inline -->
          <p v-if="!hasMultipleEvents && group.events[0].note" class="card-note">
            {{ group.events[0].note }}
          </p>
          <!-- Multi event collapsed: show event titles preview -->
          <p v-if="hasMultipleEvents && !isExpanded" class="card-preview">
            {{ group.events.map(e => e.title).join('、') }}
          </p>
        </div>

        <div class="card-actions">
          <button
            v-if="hasCoords"
            class="card-nav-btn"
            @click.stop="openMap"
            aria-label="在地圖上查看"
          >
            <Navigation :size="14" :stroke-width="1.5" />
          </button>
          <ChevronDown
            v-if="hasMultipleEvents"
            :size="16"
            :stroke-width="1.5"
            class="chevron"
            :class="{ rotated: isExpanded }"
          />
        </div>
      </div>

      <!-- Expanded sub-events -->
      <div class="sub-events-wrapper" :class="{ open: isExpanded }">
        <div class="sub-events">
          <div
            v-for="(event, idx) in group.events"
            :key="idx"
            class="sub-event"
            :class="{ 'sub-highlight': event.highlight }"
          >
            <span class="sub-time font-mono">{{ event.time }}</span>
            <div class="sub-icon" :style="{ color: getCategoryColor(event.category), background: getCategorySoftColor(event.category) }">
              <component :is="resolveIcon(event.icon)" :size="14" :stroke-width="1.5" />
            </div>
            <div class="sub-content">
              <span class="sub-title">{{ event.title }}</span>
              <div v-if="event.location" class="sub-location">
                <MapPin :size="11" :stroke-width="1.5" />
                <span>{{ event.location }}</span>
                <a
                  v-if="event.mapUrl"
                  :href="event.mapUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="map-link"
                  @click.stop
                >
                  <ExternalLink :size="11" :stroke-width="1.5" />
                </a>
              </div>
              <p v-if="event.note" class="sub-note">{{ event.note }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.location-group {
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

/* --- Time Column --- */
.time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 60px;
  flex-shrink: 0;
  padding-top: var(--space-md);
}

.time-text {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
  white-space: nowrap;
  text-align: center;
  line-height: 1.3;
}

.timeline-line {
  width: 1px;
  flex: 1;
  background: var(--border-subtle);
  margin-top: var(--space-sm);
  min-height: 24px;
}

.highlight .time-text {
  color: var(--accent);
  font-weight: 600;
}

/* --- Card --- */
.card {
  flex: 1;
  background: var(--surface-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-subtle);
  margin-bottom: var(--space-sm);
  overflow: hidden;
  transition:
    box-shadow var(--duration-normal) var(--ease-out),
    transform var(--duration-fast) var(--ease-out);
}

.card-highlight {
  border-left: 3px solid var(--accent);
  background: var(--accent-soft);
}

/* --- Card Header --- */
.card-header {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-md);
  align-items: flex-start;
}

.card-header.clickable {
  cursor: pointer;
  user-select: none;
}

.card-header.clickable:active {
  background: var(--surface-base);
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

.card-header-content {
  flex: 1;
  min-width: 0;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--text-primary);
}

.event-count-chip {
  font-size: 0.65rem;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  background: var(--accent-soft);
  color: var(--accent);
  white-space: nowrap;
}

.card-note {
  margin-top: 4px;
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.card-preview {
  margin-top: 4px;
  font-size: 0.78rem;
  color: var(--text-tertiary);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
  align-self: center;
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
  transition: opacity var(--duration-fast), background var(--duration-fast);
}

.card-nav-btn:active {
  opacity: 1;
  background: var(--accent-transport-soft);
}

.chevron {
  color: var(--text-tertiary);
  transition: transform var(--duration-normal) var(--ease-out);
}

.chevron.rotated {
  transform: rotate(180deg);
}

/* --- Sub Events (expand/collapse) --- */
.sub-events-wrapper {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--duration-normal) var(--ease-out);
}

.sub-events-wrapper.open {
  grid-template-rows: 1fr;
}

.sub-events {
  overflow: hidden;
  border-top: 1px solid transparent;
}

.sub-events-wrapper.open .sub-events {
  border-top-color: var(--border-subtle);
}

.sub-event {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  align-items: flex-start;
}

.sub-event:not(:last-child) {
  border-bottom: 1px solid var(--border-subtle);
}

.sub-highlight {
  background: var(--accent-soft);
}

.sub-time {
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-secondary);
  width: 38px;
  flex-shrink: 0;
  padding-top: 2px;
}

.sub-highlight .sub-time {
  color: var(--accent-primary);
  font-weight: 600;
}

.sub-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  flex-shrink: 0;
}

.sub-content {
  flex: 1;
  min-width: 0;
}

.sub-title {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.4;
}

.sub-location {
  display: flex;
  align-items: center;
  gap: 3px;
  margin-top: 2px;
  font-size: 0.72rem;
  color: var(--text-tertiary);
}

.map-link {
  display: inline-flex;
  align-items: center;
  padding: 2px;
  margin-left: 2px;
  color: var(--accent-transport);
  opacity: 0.7;
  min-width: 20px;
  min-height: 20px;
  justify-content: center;
}

.sub-note {
  margin-top: 2px;
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

@media (min-width: 768px) {
  .time-col {
    width: 72px;
  }

  .time-text {
    font-size: 0.78rem;
  }
}
</style>
