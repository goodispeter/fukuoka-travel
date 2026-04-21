import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/global.css'

const routes = [
  { path: '/', redirect: '/day/6' },
  { path: '/day/:dayNum', name: 'day', component: () => import('./pages/DayView.vue') },
  { path: '/info', name: 'info', component: () => import('./pages/InfoView.vue') },
  { path: '/packing', name: 'packing', component: () => import('./pages/PackingView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const app = createApp(App)
app.use(router)
app.mount('#app')
