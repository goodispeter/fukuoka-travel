<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useItinerary } from '../composables/useItinerary'

const { trip } = useItinerary()

const now = ref(new Date())
let timer = null

onMounted(() => {
  timer = setInterval(() => { now.value = new Date() }, 60000)
})
onUnmounted(() => { clearInterval(timer) })

const daysUntil = computed(() => {
  const target = new Date(trip.marathonDate)
  const diff = Math.ceil((target - now.value) / (1000 * 60 * 60 * 24))
  if (diff > 0) return { value: diff, label: '天後開跑' }
  if (diff === 0) return { value: 0, label: '今天就是比賽日！' }
  return { value: Math.abs(diff), label: '天前已完賽' }
})
</script>

<template>
  <div class="countdown-chip">
    <template v-if="daysUntil.value > 0 || daysUntil.value === 0">
      <span v-if="daysUntil.value > 0" class="chip-num font-mono">{{ daysUntil.value }}</span>
      <span class="chip-label">{{ daysUntil.label }}</span>
    </template>
    <template v-else>
      <span class="chip-num font-mono">{{ daysUntil.value }}</span>
      <span class="chip-label">{{ daysUntil.label }}</span>
    </template>
  </div>
</template>

<style scoped>
.countdown-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--accent-primary-soft);
  color: var(--accent-primary);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 500;
}

.chip-num {
  font-size: 1.1rem;
  font-weight: 600;
}
</style>
