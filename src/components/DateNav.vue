<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useItinerary } from '../composables/useItinerary'
import { Trophy } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const { days, isMarathonDay } = useItinerary()

const scrollContainer = ref(null)

const currentDayNum = ref(Number(route.params.dayNum) || 6)

watch(() => route.params.dayNum, (val) => {
  currentDayNum.value = Number(val) || 6
  scrollToActive()
})

function selectDay(dayNum) {
  router.push(`/day/${dayNum}`)
}

function scrollToActive() {
  nextTick(() => {
    const el = scrollContainer.value?.querySelector('.date-chip.active')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  })
}

onMounted(scrollToActive)

const weekdays = ['日', '月', '火', '水', '木', '金', '土']

function getWeekday(dateStr) {
  const d = new Date(dateStr)
  return weekdays[d.getDay()]
}
</script>

<template>
  <div class="date-nav-wrapper">
    <div ref="scrollContainer" class="date-nav" role="tablist" aria-label="日期選擇">
      <button
        v-for="day in days"
        :key="day.dayNum"
        class="date-chip"
        :class="{
          active: currentDayNum === day.dayNum,
          marathon: day.theme === 'marathon',
        }"
        role="tab"
        :aria-selected="currentDayNum === day.dayNum"
        :aria-label="`${day.date} ${day.label}`"
        @click="selectDay(day.dayNum)"
      >
        <span class="chip-weekday">{{ getWeekday(day.date) }}</span>
        <span class="chip-date">{{ day.dayNum }}</span>
        <Trophy
          v-if="day.theme === 'marathon'"
          :size="12"
          :stroke-width="2"
          class="chip-marathon-icon"
        />
        <span v-else class="chip-dot" :class="{ 'active-dot': currentDayNum === day.dayNum }"></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.date-nav-wrapper {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--surface-base);
  border-bottom: 1px solid var(--border-subtle);
  padding: var(--space-sm) 0;
}

.date-nav {
  display: flex;
  gap: var(--space-sm);
  overflow-x: auto;
  padding: var(--space-xs) var(--space-lg);
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-snap-type: x mandatory;
}

.date-nav::-webkit-scrollbar {
  display: none;
}

.date-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 52px;
  padding: var(--space-sm) var(--space-sm);
  border-radius: var(--radius-md);
  background: transparent;
  transition:
    background var(--duration-fast) var(--ease-out),
    transform var(--duration-fast) var(--ease-out),
    box-shadow var(--duration-fast) var(--ease-out);
  scroll-snap-align: center;
  position: relative;
}

.date-chip:active {
  transform: scale(0.93);
}

.date-chip.active {
  background: var(--surface-card);
  box-shadow: var(--shadow-card);
}

.date-chip.active.marathon {
  background: var(--accent-primary);
}

.date-chip.active.marathon .chip-weekday,
.date-chip.active.marathon .chip-date {
  color: var(--text-inverse);
}

.date-chip.active.marathon .chip-marathon-icon {
  color: var(--text-inverse);
}

.chip-weekday {
  font-size: 0.65rem;
  font-weight: 500;
  color: var(--text-tertiary);
  text-transform: uppercase;
}

.chip-date {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--text-primary);
  line-height: 1.2;
}

.date-chip.active .chip-weekday {
  color: var(--text-secondary);
}

.date-chip.active .chip-date {
  font-weight: 600;
  color: var(--accent-primary);
}

.date-chip.active.marathon .chip-date {
  color: var(--text-inverse);
}

.chip-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--border-medium);
  transition: background var(--duration-fast);
}

.chip-dot.active-dot {
  background: var(--accent-primary);
}

.chip-marathon-icon {
  color: var(--accent-primary);
}

.date-chip.marathon:not(.active) .chip-date {
  color: var(--accent-primary);
}
</style>
