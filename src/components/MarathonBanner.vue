<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Trophy, MapPin, Timer, Target, Route } from 'lucide-vue-next'

const props = defineProps({
  marathon: { type: Object, required: true },
})

const now = ref(new Date())
let timer = null

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

const marathonStart = computed(() => {
  const [h, m] = props.marathon.startTime.split(':')
  const d = new Date('2026-11-08')
  d.setHours(Number(h), Number(m), 0, 0)
  return d
})

const countdown = computed(() => {
  const diff = marathonStart.value - now.value
  if (diff <= 0) return null

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((diff / (1000 * 60)) % 60)
  const seconds = Math.floor((diff / 1000) % 60)

  return { days, hours, minutes, seconds }
})
</script>

<template>
  <div class="marathon-banner">
    <!-- Decorative background pattern -->
    <div class="banner-pattern"></div>

    <div class="banner-content">
      <div class="banner-header">
        <Trophy :size="28" :stroke-width="1.5" class="banner-trophy" />
        <h2 class="banner-title font-display">Race Day</h2>
        <p class="banner-subtitle">福岡マラソン 2025</p>
      </div>

      <!-- Countdown -->
      <div v-if="countdown" class="countdown">
        <div class="countdown-unit">
          <span class="countdown-num font-mono">{{ String(countdown.days).padStart(2, '0') }}</span>
          <span class="countdown-label">DAYS</span>
        </div>
        <span class="countdown-sep font-mono">:</span>
        <div class="countdown-unit">
          <span class="countdown-num font-mono">{{ String(countdown.hours).padStart(2, '0') }}</span>
          <span class="countdown-label">HRS</span>
        </div>
        <span class="countdown-sep font-mono">:</span>
        <div class="countdown-unit">
          <span class="countdown-num font-mono">{{ String(countdown.minutes).padStart(2, '0') }}</span>
          <span class="countdown-label">MIN</span>
        </div>
        <span class="countdown-sep font-mono">:</span>
        <div class="countdown-unit">
          <span class="countdown-num font-mono">{{ String(countdown.seconds).padStart(2, '0') }}</span>
          <span class="countdown-label">SEC</span>
        </div>
      </div>
      <div v-else class="race-complete">
        <Trophy :size="20" :stroke-width="1.5" />
        <span class="font-display">RACE COMPLETE</span>
      </div>

      <!-- Key Info -->
      <div class="info-grid">
        <div class="info-item">
          <Timer :size="16" :stroke-width="1.5" />
          <div>
            <span class="info-label">起跑</span>
            <span class="info-value font-mono">{{ marathon.startTime }}</span>
          </div>
        </div>
        <div class="info-item">
          <Route :size="16" :stroke-width="1.5" />
          <div>
            <span class="info-label">距離</span>
            <span class="info-value font-mono">{{ marathon.distance }}</span>
          </div>
        </div>
        <div class="info-item">
          <Target :size="16" :stroke-width="1.5" />
          <div>
            <span class="info-label">目標</span>
            <span class="info-value">{{ marathon.targetTime }}</span>
          </div>
        </div>
        <div class="info-item">
          <MapPin :size="16" :stroke-width="1.5" />
          <div>
            <span class="info-label">起點</span>
            <span class="info-value">{{ marathon.startLocation }}</span>
          </div>
        </div>
      </div>

      <!-- Course -->
      <div v-if="marathon.course" class="course-info">
        <span class="course-label">路線</span>
        <p class="course-text">{{ marathon.course }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.marathon-banner {
  position: relative;
  margin: var(--space-md) var(--space-lg);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--surface-marathon);
  color: #fff;
  animation: bannerReveal var(--duration-slow) var(--ease-out) both;
}

@keyframes bannerReveal {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.banner-pattern {
  position: absolute;
  inset: 0;
  opacity: 0.08;
  background-image:
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 20px,
      rgba(255,255,255,0.1) 20px,
      rgba(255,255,255,0.1) 21px
    );
  pointer-events: none;
}

.banner-content {
  position: relative;
  padding: var(--space-lg);
}

.banner-header {
  text-align: center;
  margin-bottom: var(--space-lg);
}

.banner-trophy {
  margin-bottom: var(--space-xs);
  opacity: 0.9;
}

.banner-title {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  line-height: 1.1;
}

.banner-subtitle {
  font-size: 0.85rem;
  opacity: 0.8;
  margin-top: 4px;
  letter-spacing: 0.03em;
}

/* Countdown */
.countdown {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
}

.countdown-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
}

.countdown-num {
  font-size: 2rem;
  font-weight: 500;
  line-height: 1;
  letter-spacing: -0.02em;
}

.countdown-label {
  font-size: 0.6rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  opacity: 0.7;
  margin-top: 4px;
}

.countdown-sep {
  font-size: 1.5rem;
  opacity: 0.5;
  padding-bottom: 16px;
}

.race-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-lg);
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-sm);
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: rgba(255, 255, 255, 0.12);
  border-radius: var(--radius-sm);
  backdrop-filter: blur(4px);
}

.info-item > div {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.65rem;
  opacity: 0.7;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.3;
}

/* Course */
.course-info {
  margin-top: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  background: rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm);
}

.course-label {
  font-size: 0.65rem;
  opacity: 0.7;
  letter-spacing: 0.05em;
}

.course-text {
  font-size: 0.8rem;
  line-height: 1.5;
  margin-top: 2px;
  opacity: 0.9;
}
</style>
