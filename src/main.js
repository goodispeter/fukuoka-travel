import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import { initTheme } from './composables/useTheme'
import './styles/global.css'

initTheme()

const routes = [
  { path: '/', redirect: '/day/6' },
  { path: '/day/:dayNum', name: 'day', component: () => import('./pages/DayView.vue') },
  { path: '/map', name: 'map', component: () => import('./pages/MapView.vue') },
  { path: '/phrases', name: 'phrases', component: () => import('./pages/PhrasesView.vue') },
  { path: '/more', name: 'more', component: () => import('./pages/MoreView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')
