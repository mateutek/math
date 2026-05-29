import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'

const routes = [
  {
    path: '/',
    redirect: '/dodawanie/1',
    name: 'Home',
    component: Home,
  },
  {
    path: '/dodawanie/:level?',
    name: 'addition',
    component: () => import('@/pages/Addition.vue'),
  },
  {
    path: '/odejmowanie/:level?',
    name: 'subtraction',
    component: () => import('@/pages/Subtraction.vue'),
  },
  {
    path: '/dzielenie/:level?',
    name: 'divide',
    component: () => import('@/pages/Divide.vue'),
  },
  {
    path: '/dzielenie2/:level?',
    name: 'divide2',
    component: () => import('@/pages/Divide_2.vue'),
  },
  {
    path: '/mnozenie/:level?',
    name: 'multiply',
    component: () => import('@/pages/Multiply.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
