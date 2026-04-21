<script setup>
import { useItinerary } from '../composables/useItinerary'
import { Phone, TrainFront, Lightbulb } from 'lucide-vue-next'

const { info } = useItinerary()

const sections = [
  { key: 'emergency', title: '緊急聯絡', icon: Phone, items: info.emergency },
  { key: 'transport', title: '交通資訊', icon: TrainFront, items: info.transport },
  { key: 'useful', title: '實用資訊', icon: Lightbulb, items: info.useful },
]
</script>

<template>
  <div class="info-view">
    <div class="info-header">
      <h2 class="info-title font-display">旅行資訊</h2>
      <p class="info-subtitle">重要聯絡方式和實用資訊</p>
    </div>

    <div class="info-sections">
      <section
        v-for="(section, sIdx) in sections"
        :key="section.key"
        class="info-section"
        :style="{ '--stagger': `${sIdx * 80}ms` }"
      >
        <div class="section-header">
          <component :is="section.icon" :size="18" :stroke-width="1.5" />
          <h3>{{ section.title }}</h3>
        </div>

        <div class="info-cards">
          <div
            v-for="(item, idx) in section.items"
            :key="idx"
            class="info-card"
          >
            <span class="info-label">{{ item.label }}</span>
            <span class="info-value">{{ item.value }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.info-view {
  padding: var(--space-lg);
}

.info-header {
  margin-bottom: var(--space-xl);
}

.info-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.info-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.info-sections {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.info-section {
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

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  color: var(--text-primary);
}

.section-header h3 {
  font-size: 1rem;
  font-weight: 600;
}

.info-cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-md);
  background: var(--surface-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-subtle);
}

.info-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-tertiary);
  letter-spacing: 0.03em;
}

.info-value {
  font-size: 0.92rem;
  color: var(--text-primary);
  line-height: 1.5;
}

@media (min-width: 768px) {
  .info-view {
    padding: var(--space-xl);
  }

  .info-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
