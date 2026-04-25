<script setup>
import { ref } from 'vue'
import { useItinerary } from '../composables/useItinerary'
import { useTheme } from '../composables/useTheme'
import {
  Phone, TrainFront, Lightbulb,
  Check, RotateCcw, Shirt, Zap, FileText, Droplets, Trophy,
  ChevronDown, SunMoon, Sun, Moon,
} from 'lucide-vue-next'

const { info, packingList } = useItinerary()
const { themePref, setTheme } = useTheme()

const themeOptions = [
  { value: 'auto', label: '自動', icon: SunMoon },
  { value: 'light', label: '淺色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
]

const activeSection = ref('info')

// --- Info data ---
const infoSections = [
  { key: 'emergency', title: '緊急聯絡', icon: Phone, items: info.emergency },
  { key: 'transport', title: '交通資訊', icon: TrainFront, items: info.transport },
  { key: 'useful', title: '實用資訊', icon: Lightbulb, items: info.useful },
]

// --- Packing data ---
const STORAGE_KEY = 'fukuoka-packing'
const categories = [
  { key: 'running', label: '跑步裝備', icon: Trophy },
  { key: 'clothing', label: '衣物', icon: Shirt },
  { key: 'electronics', label: '電子產品', icon: Zap },
  { key: 'documents', label: '證件文件', icon: FileText },
  { key: 'toiletries', label: '盥洗用品', icon: Droplets },
]

const checkedItems = ref({})
try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) checkedItems.value = JSON.parse(saved)
} catch {}

function toggle(category, idx) {
  const key = `${category}-${idx}`
  checkedItems.value[key] = !checkedItems.value[key]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(checkedItems.value))
}

function isChecked(category, idx) {
  return !!checkedItems.value[`${category}-${idx}`]
}

function resetAll() {
  checkedItems.value = {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify({}))
}

function totalItems() {
  return categories.reduce((sum, cat) => sum + (packingList[cat.key]?.length || 0), 0)
}

function checkedCount() {
  return Object.values(checkedItems.value).filter(Boolean).length
}

function progress() {
  const total = totalItems()
  if (total === 0) return 0
  return Math.round((checkedCount() / total) * 100)
}
</script>

<template>
  <div class="more-view">
    <!-- Theme Switcher -->
    <div class="setting-row" role="group" aria-label="外觀">
      <span class="setting-label">外觀</span>
      <div class="theme-switch">
        <button
          v-for="opt in themeOptions"
          :key="opt.value"
          class="theme-btn"
          :class="{ active: themePref === opt.value }"
          :aria-label="opt.label"
          :aria-pressed="themePref === opt.value"
          @click="setTheme(opt.value)"
        >
          <component :is="opt.icon" :size="16" :stroke-width="1.75" />
          <span class="theme-btn-label">{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <!-- Section Toggle -->
    <div class="section-toggle">
      <button
        class="toggle-btn"
        :class="{ active: activeSection === 'info' }"
        @click="activeSection = 'info'"
      >旅行資訊</button>
      <button
        class="toggle-btn"
        :class="{ active: activeSection === 'packing' }"
        @click="activeSection = 'packing'"
      >
        打包清單
        <span v-if="checkedCount() > 0" class="badge font-mono">{{ progress() }}%</span>
      </button>
    </div>

    <!-- Info Section -->
    <div v-if="activeSection === 'info'" class="section-content">
      <section
        v-for="(section, sIdx) in infoSections"
        :key="section.key"
        class="info-section"
        :style="{ '--stagger': `${sIdx * 60}ms` }"
      >
        <div class="section-header">
          <component :is="section.icon" :size="18" :stroke-width="1.5" />
          <h3>{{ section.title }}</h3>
        </div>
        <div class="info-cards">
          <div v-for="(item, idx) in section.items" :key="idx" class="info-card">
            <span class="info-label">{{ item.label }}</span>
            <span class="info-value">{{ item.value }}</span>
          </div>
        </div>
      </section>
    </div>

    <!-- Packing Section -->
    <div v-if="activeSection === 'packing'" class="section-content">
      <div class="packing-header-row">
        <span class="packing-status">{{ checkedCount() }} / {{ totalItems() }} 項</span>
        <button class="reset-btn" @click="resetAll" :disabled="checkedCount() === 0" aria-label="重置">
          <RotateCcw :size="14" :stroke-width="1.5" />
          <span>重置</span>
        </button>
      </div>

      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress()}%` }"></div>
        </div>
        <span class="progress-text font-mono">{{ progress() }}%</span>
      </div>

      <section
        v-for="(cat, cIdx) in categories"
        :key="cat.key"
        class="pack-category"
        :style="{ '--stagger': `${cIdx * 50}ms` }"
      >
        <div class="cat-header">
          <component :is="cat.icon" :size="16" :stroke-width="1.5" />
          <h3>{{ cat.label }}</h3>
        </div>
        <div class="item-list">
          <button
            v-for="(item, idx) in packingList[cat.key]"
            :key="idx"
            class="item-row"
            :class="{ checked: isChecked(cat.key, idx) }"
            @click="toggle(cat.key, idx)"
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
.more-view {
  padding: var(--space-md) var(--space-lg);
}

/* Theme Switcher */
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.setting-label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.theme-switch {
  display: flex;
  gap: 2px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 3px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  min-height: 32px;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-tertiary);
  transition: all var(--duration-fast) var(--ease-out);
}

.theme-btn:active {
  transform: scale(0.93);
}

.theme-btn.active {
  background: var(--surface-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}

.theme-btn-label {
  line-height: 1;
}

/* Toggle */
.section-toggle {
  display: flex;
  gap: 4px;
  background: var(--border-subtle);
  border-radius: var(--radius-full);
  padding: 3px;
  margin-bottom: var(--space-lg);
}

.toggle-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--duration-fast) var(--ease-out);
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.toggle-btn.active {
  background: var(--surface-card);
  color: var(--text-primary);
  box-shadow: var(--shadow-card);
}

.badge {
  font-size: 0.7rem;
  background: var(--accent-primary-soft);
  color: var(--accent-primary);
  padding: 1px 6px;
  border-radius: var(--radius-full);
}

/* Section content */
.section-content {
  animation: fadeIn var(--duration-normal) var(--ease-out);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Info */
.info-section {
  margin-bottom: var(--space-xl);
  animation: fadeSlideUp var(--duration-slow) var(--ease-out) var(--stagger) both;
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  color: var(--text-primary);
}

.section-header h3 {
  font-size: 0.95rem;
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
  font-size: 0.72rem;
  font-weight: 500;
  color: var(--text-tertiary);
}

.info-value {
  font-size: 0.9rem;
  color: var(--text-primary);
  line-height: 1.5;
}

/* Packing */
.packing-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-md);
}

.packing-status {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-full);
  min-height: 32px;
}

.reset-btn:disabled {
  opacity: 0.4;
  pointer-events: none;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.progress-bar {
  flex: 1;
  height: 5px;
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
  font-size: 0.75rem;
  color: var(--accent-primary);
  min-width: 32px;
  text-align: right;
}

.pack-category {
  margin-bottom: var(--space-lg);
  animation: fadeSlideUp var(--duration-slow) var(--ease-out) var(--stagger) both;
}

.cat-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
  color: var(--text-primary);
}

.cat-header h3 {
  font-size: 0.9rem;
  font-weight: 600;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-sm);
  border-radius: var(--radius-sm);
  min-height: 44px;
  text-align: left;
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
  width: 20px;
  height: 20px;
  border-radius: 5px;
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
  font-size: 0.85rem;
  color: var(--text-primary);
  line-height: 1.4;
}

@media (min-width: 768px) {
  .info-cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .item-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1px var(--space-md);
  }
}
</style>
