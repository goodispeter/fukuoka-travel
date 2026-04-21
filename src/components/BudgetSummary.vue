<script setup>
import { computed } from 'vue'
import { TrainFront, Utensils, BedDouble, Ticket, ShoppingBag } from 'lucide-vue-next'
import budgetData from '../data/budget.json'

const props = defineProps({
  dayNum: { type: Number, required: true },
})

const CATEGORY_CONFIG = {
  transport: { icon: TrainFront, label: '交通', color: 'var(--accent-transport)' },
  food: { icon: Utensils, label: '餐飲', color: 'var(--accent-food)' },
  accommodation: { icon: BedDouble, label: '住宿', color: 'var(--accent-rest)' },
  activity: { icon: Ticket, label: '活動', color: 'var(--accent-culture)' },
  shopping: { icon: ShoppingBag, label: '購物', color: 'var(--accent-shopping)' },
}

const exchangeRate = budgetData.exchangeRate.TWD

const dayBudget = computed(() =>
  budgetData.days.find((d) => d.dayNum === props.dayNum)
)

const dailyTotal = computed(() => {
  if (!dayBudget.value) return 0
  return dayBudget.value.items.reduce((sum, item) => sum + item.amount, 0)
})

const dailyTotalTWD = computed(() => Math.round(dailyTotal.value * exchangeRate))

const categoryTotals = computed(() => {
  if (!dayBudget.value) return []
  const map = {}
  for (const item of dayBudget.value.items) {
    if (!map[item.category]) {
      map[item.category] = 0
    }
    map[item.category] += item.amount
  }
  return Object.entries(map).map(([category, amount]) => ({
    category,
    amount,
    percent: dailyTotal.value > 0 ? (amount / dailyTotal.value) * 100 : 0,
    ...CATEGORY_CONFIG[category],
  }))
})

function formatNumber(n) {
  return n.toLocaleString('en-US')
}
</script>

<template>
  <div v-if="dayBudget" class="budget-card">
    <!-- Daily total -->
    <div class="budget-header">
      <div class="total-jpy font-mono">¥{{ formatNumber(dailyTotal) }}</div>
      <div class="total-twd">≈ NT${{ formatNumber(dailyTotalTWD) }}</div>
    </div>

    <!-- Stacked bar -->
    <div class="stacked-bar">
      <div
        v-for="cat in categoryTotals"
        :key="cat.category"
        class="bar-segment"
        :style="{ width: cat.percent + '%', backgroundColor: cat.color }"
      />
    </div>

    <!-- Category breakdown -->
    <ul class="category-list">
      <li v-for="cat in categoryTotals" :key="cat.category" class="category-item">
        <span class="category-icon" :style="{ color: cat.color }">
          <component :is="cat.icon" :size="16" :stroke-width="1.8" />
        </span>
        <span class="category-label">{{ cat.label }}</span>
        <span class="category-amount font-mono">¥{{ formatNumber(cat.amount) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.budget-card {
  background: var(--surface-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.budget-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.total-jpy {
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1;
}

.total-twd {
  font-size: 0.82rem;
  opacity: 0.55;
}

/* Stacked bar */
.stacked-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.bar-segment {
  min-width: 3px;
  transition: width 0.3s ease;
}

.bar-segment:first-child {
  border-radius: 4px 0 0 4px;
}

.bar-segment:last-child {
  border-radius: 0 4px 4px 0;
}

.bar-segment:only-child {
  border-radius: 4px;
}

/* Category list */
.category-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
}

.category-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.category-label {
  flex: 1;
  opacity: 0.8;
}

.category-amount {
  font-weight: 600;
  font-size: 0.85rem;
}
</style>
