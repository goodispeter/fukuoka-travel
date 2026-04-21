<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { CalendarDays, Map, Languages, Ellipsis } from 'lucide-vue-next'
import DateNav from './components/DateNav.vue'
import itinerary from './data/itinerary.json'

const route = useRoute()

const currentTab = computed(() => {
  if (route.name === 'map') return 'map'
  if (route.name === 'phrases') return 'phrases'
  if (route.name === 'more') return 'more'
  return 'itinerary'
})

const showDateNav = computed(() => currentTab.value === 'itinerary')
const showHeader = computed(() => currentTab.value !== 'map')

const tripTitle = itinerary.trip.title

// Track current day number for syncing between itinerary and map tabs
const currentDayNum = computed(() => {
  if (route.name === 'day' && route.params.dayNum) return Number(route.params.dayNum)
  if (route.name === 'map' && route.query.day) return Number(route.query.day)
  return 6
})

const mapLink = computed(() => `/map?day=${currentDayNum.value}`)
const itineraryLink = computed(() => `/day/${currentDayNum.value}`)
</script>

<template>
  <div class="app-shell">
    <!-- Header -->
    <header v-if="showHeader" class="app-header">
      <h1 class="app-title font-display">{{ tripTitle }}</h1>
      <p class="app-subtitle">{{ itinerary.trip.startDate.slice(5) }} — {{ itinerary.trip.endDate.slice(5) }}</p>
    </header>

    <!-- Date Nav (persistent, outside router-view) -->
    <DateNav v-if="showDateNav" />

    <!-- Main Content -->
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </main>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav" role="navigation" aria-label="主導航">
      <router-link
        :to="itineraryLink"
        class="nav-item"
        :class="{ active: currentTab === 'itinerary' }"
        aria-label="行程"
      >
        <CalendarDays :size="22" :stroke-width="1.5" />
        <span class="nav-label">行程</span>
      </router-link>
      <router-link
        :to="mapLink"
        class="nav-item"
        :class="{ active: currentTab === 'map' }"
        aria-label="地圖"
      >
        <Map :size="22" :stroke-width="1.5" />
        <span class="nav-label">地圖</span>
      </router-link>
      <router-link
        to="/phrases"
        class="nav-item"
        :class="{ active: currentTab === 'phrases' }"
        aria-label="日語"
      >
        <Languages :size="22" :stroke-width="1.5" />
        <span class="nav-label">日語</span>
      </router-link>
      <router-link
        to="/more"
        class="nav-item"
        :class="{ active: currentTab === 'more' }"
        aria-label="更多"
      >
        <Ellipsis :size="22" :stroke-width="1.5" />
        <span class="nav-label">更多</span>
      </router-link>
    </nav>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  max-width: var(--content-max-width);
  margin: 0 auto;
  position: relative;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--surface-base);
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.app-title {
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--text-primary);
}

.app-subtitle {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 2px;
}

.app-main {
  flex: 1;
  padding-bottom: calc(var(--bottom-bar-height) + var(--space-lg));
}

/* Bottom Nav */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--content-max-width);
  height: var(--bottom-bar-height);
  background: var(--surface-card);
  border-top: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: var(--space-sm) var(--space-lg);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  transition: color var(--duration-fast) var(--ease-out);
  min-width: 64px;
  min-height: 44px;
  justify-content: center;
}

.nav-item.active {
  color: var(--accent-primary);
}

.nav-item:active {
  transform: scale(0.95);
}

.nav-label {
  font-size: 0.7rem;
  font-weight: 500;
}

/* === Transition === */
.fade-enter-active {
  transition: opacity 120ms var(--ease-out);
}
.fade-leave-active {
  transition: opacity 80ms var(--ease-in);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (min-width: 768px) {
  .app-header {
    text-align: center;
    padding: var(--space-lg) var(--space-xl);
  }

  .app-title {
    font-size: 1.6rem;
  }
}
</style>
