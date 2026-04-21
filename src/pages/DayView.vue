<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useItinerary } from '../composables/useItinerary'
import TimelineCard from '../components/TimelineCard.vue'
import MarathonBanner from '../components/MarathonBanner.vue'
import CountdownChip from '../components/CountdownChip.vue'
import WeatherBadge from '../components/WeatherBadge.vue'

const route = useRoute()
const { getDayByNum, isMarathonDay } = useItinerary()

const dayNum = computed(() => Number(route.params.dayNum) || 6)
const day = computed(() => getDayByNum(dayNum.value))
const isMarathon = computed(() => isMarathonDay(dayNum.value))

// Scroll to top on day change
watch(dayNum, () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

function getThemeLabel(theme) {
  const map = {
    travel: '移動日',
    prepare: '賽前準備',
    marathon: '比賽日',
    recovery: '恢復日',
    daytrip: '一日遊',
    explore: '市區探索',
  }
  return map[theme] || ''
}
</script>

<template>
  <div class="day-view">
    <div v-if="day" class="day-content">
      <!-- Day Header -->
      <div class="day-header" :class="{ 'marathon-header': isMarathon }">
        <div class="day-header-top">
          <div>
            <span class="day-date font-mono">11/{{ day.dayNum }}</span>
            <span class="day-theme-tag">{{ getThemeLabel(day.theme) }}</span>
          </div>
          <div class="day-header-right">
            <WeatherBadge :date="day.date" />
            <CountdownChip v-if="isMarathon" />
          </div>
        </div>
        <h2 class="day-label font-display">{{ day.label }}</h2>
      </div>

      <!-- Marathon Banner -->
      <MarathonBanner v-if="isMarathon && day.marathon" :marathon="day.marathon" />

      <!-- Timeline -->
      <div class="timeline">
        <TimelineCard
          v-for="(event, idx) in day.events"
          :key="idx"
          :event="event"
          :index="idx"
          :day-num="day.dayNum"
          :is-marathon-day="isMarathon"
        />
      </div>
    </div>

    <div v-else class="empty-state">
      <p>找不到這天的行程資料</p>
    </div>
  </div>
</template>

<style scoped>
.day-view {
  min-height: 100%;
}

.day-content {
  padding-bottom: var(--space-xl);
}

.day-header {
  padding: var(--space-lg) var(--space-lg) var(--space-md);
}

.day-header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.day-date {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.day-theme-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--border-subtle);
  color: var(--text-secondary);
  margin-left: var(--space-sm);
  vertical-align: middle;
}

.marathon-header .day-theme-tag {
  background: var(--accent-primary-soft);
  color: var(--accent-primary);
}

.day-label {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: var(--space-xs);
  line-height: 1.3;
}

.marathon-header .day-label {
  color: var(--accent-primary);
}

.day-header-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

/* Timeline */
.timeline {
  padding: 0 var(--space-md) 0 var(--space-sm);
}

/* Empty state */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 40vh;
  color: var(--text-tertiary);
  font-size: 0.9rem;
}

@media (min-width: 768px) {
  .timeline {
    padding: 0 var(--space-xl) 0 var(--space-lg);
  }

  .day-header {
    padding: var(--space-xl) var(--space-xl) var(--space-md);
  }

  .day-label {
    font-size: 1.75rem;
  }
}
</style>
