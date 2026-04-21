<script setup>
import { ref, computed, onMounted } from 'vue'
import { useItinerary } from '../composables/useItinerary'
import { Check, RotateCcw, Shirt, Zap, FileText, Droplets, Trophy } from 'lucide-vue-next'

const { packingList } = useItinerary()

const STORAGE_KEY = 'fukuoka-packing'

const categories = [
  { key: 'running', label: '跑步裝備', icon: Trophy },
  { key: 'clothing', label: '衣物', icon: Shirt },
  { key: 'electronics', label: '電子產品', icon: Zap },
  { key: 'documents', label: '證件文件', icon: FileText },
  { key: 'toiletries', label: '盥洗用品', icon: Droplets },
]

const checkedItems = ref({})

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    checkedItems.value = JSON.parse(saved)
  }
})

function toggle(category, idx) {
  const key = `${category}-${idx}`
  checkedItems.value[key] = !checkedItems.value[key]
  save()
}

function isChecked(category, idx) {
  return !!checkedItems.value[`${category}-${idx}`]
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems.value))
}

function resetAll() {
  checkedItems.value = {}
  save()
}

const totalItems = computed(() => {
  return categories.reduce((sum, cat) => sum + (packingList[cat.key]?.length || 0), 0)
})

const checkedCount = computed(() => {
  return Object.values(checkedItems.value).filter(Boolean).length
})

const progress = computed(() => {
  if (totalItems.value === 0) return 0
  return Math.round((checkedCount.value / totalItems.value) * 100)
})

function categoryProgress(catKey) {
  const items = packingList[catKey] || []
  const checked = items.filter((_, i) => isChecked(catKey, i)).length
  return { checked, total: items.length }
}
</script>

<template>
  <div class="packing-view">
    <div class="packing-header">
      <div>
        <h2 class="packing-title font-display">打包清單</h2>
        <p class="packing-subtitle">{{ checkedCount }} / {{ totalItems }} 項已完成</p>
      </div>
      <button
        class="reset-btn"
        @click="resetAll"
        aria-label="重置全部"
        :disabled="checkedCount === 0"
      >
        <RotateCcw :size="16" :stroke-width="1.5" />
        <span>重置</span>
      </button>
    </div>

    <!-- Progress Bar -->
    <div class="progress-container">
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${progress}%` }"
          role="progressbar"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
      <span class="progress-text font-mono">{{ progress }}%</span>
    </div>

    <!-- Categories -->
    <div class="categories">
      <section
        v-for="(cat, cIdx) in categories"
        :key="cat.key"
        class="category"
        :style="{ '--stagger': `${cIdx * 60}ms` }"
      >
        <div class="category-header">
          <div class="category-title-row">
            <component :is="cat.icon" :size="16" :stroke-width="1.5" />
            <h3>{{ cat.label }}</h3>
          </div>
          <span class="category-count font-mono">
            {{ categoryProgress(cat.key).checked }}/{{ categoryProgress(cat.key).total }}
          </span>
        </div>

        <div class="item-list">
          <button
            v-for="(item, idx) in packingList[cat.key]"
            :key="idx"
            class="item-row"
            :class="{ checked: isChecked(cat.key, idx) }"
            @click="toggle(cat.key, idx)"
            :aria-label="`${isChecked(cat.key, idx) ? '取消' : '勾選'} ${item}`"
          >
            <div class="checkbox" :class="{ checked: isChecked(cat.key, idx) }">
              <Check v-if="isChecked(cat.key, idx)" :size="14" :stroke-width="2.5" />
            </div>
            <span class="item-text">{{ item }}</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.packing-view {
  padding: var(--space-lg);
}

.packing-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-lg);
}

.packing-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
}

.packing-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 14px;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  min-height: 36px;
  transition: all var(--duration-fast) var(--ease-out);
}

.reset-btn:active {
  transform: scale(0.95);
}

.reset-btn:disabled {
  opacity: 0.4;
  pointer-events: none;
}

/* Progress */
.progress-container {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-primary);
  border-radius: var(--radius-full);
  transition: width var(--duration-normal) var(--ease-out);
}

.progress-text {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--accent-primary);
  min-width: 36px;
  text-align: right;
}

/* Categories */
.categories {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.category {
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

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-sm);
}

.category-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  color: var(--text-primary);
}

.category-title-row h3 {
  font-size: 0.95rem;
  font-weight: 600;
}

.category-count {
  font-size: 0.75rem;
  color: var(--text-tertiary);
}

/* Items */
.item-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  min-height: 44px;
  text-align: left;
  transition: background var(--duration-fast);
  width: 100%;
}

.item-row:active {
  background: var(--border-subtle);
}

.item-row.checked .item-text {
  color: var(--text-tertiary);
  text-decoration: line-through;
}

.checkbox {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  border: 2px solid var(--border-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all var(--duration-fast) var(--ease-out);
  color: #fff;
}

.checkbox.checked {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.item-text {
  font-size: 0.88rem;
  color: var(--text-primary);
  line-height: 1.4;
  transition: all var(--duration-fast);
}

@media (min-width: 768px) {
  .packing-view {
    padding: var(--space-xl);
  }

  .item-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 2px var(--space-md);
  }
}
</style>
