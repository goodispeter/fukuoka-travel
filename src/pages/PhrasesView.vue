<script setup>
import { ref, reactive } from 'vue'
import {
  Copy,
  Check,
  HandMetal,
  Utensils,
  TrainFront,
  ShoppingBag,
  Trophy,
  ShieldAlert,
} from 'lucide-vue-next'
import phrasesData from '../data/phrases.json'

const iconMap = {
  'hand-metal': HandMetal,
  'utensils': Utensils,
  'train-front': TrainFront,
  'shopping-bag': ShoppingBag,
  'trophy': Trophy,
  'shield-alert': ShieldAlert,
}

const categories = phrasesData.categories

// Track which categories are expanded; first one open by default
const expanded = reactive(
  Object.fromEntries(categories.map((cat, i) => [cat.key, i === 0]))
)

function toggleCategory(key) {
  expanded[key] = !expanded[key]
}

// Track copied state per phrase (keyed by "categoryKey-phraseIndex")
const copiedMap = ref({})

async function copyPhrase(categoryKey, index, japaneseText) {
  const id = `${categoryKey}-${index}`
  await navigator.clipboard.writeText(japaneseText)
  copiedMap.value[id] = true
  setTimeout(() => {
    copiedMap.value[id] = false
  }, 1500)
}
</script>

<template>
  <div class="phrases-view">
    <header class="phrases-header">
      <h1 class="font-display">日語速查</h1>
      <p class="phrases-subtitle">旅途中常用的日語短句，點擊即可複製</p>
    </header>

    <div class="categories">
      <section
        v-for="cat in categories"
        :key="cat.key"
        class="category"
      >
        <button
          class="category-header"
          :aria-expanded="expanded[cat.key]"
          @click="toggleCategory(cat.key)"
        >
          <div class="category-header-left">
            <component :is="iconMap[cat.icon]" :size="18" class="category-icon" />
            <span class="category-label">{{ cat.label }}</span>
            <span class="category-count">{{ cat.phrases.length }}</span>
          </div>
          <span class="chevron" :class="{ 'chevron-open': expanded[cat.key] }">&#9662;</span>
        </button>

        <Transition name="accordion">
          <div v-if="expanded[cat.key]" class="phrases-grid">
            <div
              v-for="(phrase, idx) in cat.phrases"
              :key="idx"
              class="phrase-card"
              :style="{ animationDelay: `${idx * 30}ms` }"
            >
              <div class="phrase-text">
                <span class="phrase-ja">{{ phrase.ja }}</span>
                <span class="phrase-romaji">{{ phrase.romaji }}</span>
                <span class="phrase-zh">{{ phrase.zh }}</span>
              </div>
              <button
                class="copy-btn"
                :class="{ copied: copiedMap[`${cat.key}-${idx}`] }"
                @click="copyPhrase(cat.key, idx, phrase.ja)"
                :aria-label="`複製 ${phrase.ja}`"
              >
                <Check v-if="copiedMap[`${cat.key}-${idx}`]" :size="16" />
                <Copy v-else :size="16" />
              </button>
            </div>
          </div>
        </Transition>
      </section>
    </div>
  </div>
</template>

<style scoped>
.phrases-view {
  padding: var(--space-lg);
  max-width: 960px;
  margin: 0 auto;
}

.phrases-header {
  margin-bottom: var(--space-lg);
}

.phrases-header h1 {
  font-size: 1.5rem;
  margin: 0 0 0.25rem;
}

.phrases-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
}

.categories {
  display: flex;
  flex-direction: column;
  gap: var(--space-md, 1rem);
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  background: var(--surface-card);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  color: inherit;
  transition: background 0.15s;
}

.category-header:hover {
  opacity: 0.85;
}

.category-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-icon {
  flex-shrink: 0;
  color: var(--text-secondary);
}

.category-count {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-tertiary);
  background: var(--surface-muted, rgba(128, 128, 128, 0.1));
  border-radius: 999px;
  padding: 0.1rem 0.5rem;
}

.chevron {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  color: var(--text-tertiary);
}

.chevron-open {
  transform: rotate(180deg);
}

/* Accordion transition */
.accordion-enter-active,
.accordion-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Phrases grid */
.phrases-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media (min-width: 640px) {
  .phrases-grid {
    grid-template-columns: 1fr 1fr;
  }
}

/* Stagger animation */
@keyframes fadeSlideIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.phrase-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  animation: fadeSlideIn 0.3s ease both;
}

.phrase-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.phrase-ja {
  font-size: 1.1rem;
  font-weight: 600;
  line-height: 1.4;
}

.phrase-romaji {
  font-size: 0.75rem;
  font-style: italic;
  color: var(--text-tertiary);
}

.phrase-zh {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.copy-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.copy-btn:hover {
  background: var(--surface-muted, rgba(128, 128, 128, 0.1));
  color: var(--text-secondary);
}

.copy-btn.copied {
  color: #22c55e;
}
</style>
