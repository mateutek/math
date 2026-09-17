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
  {
    path: '/gry/domino/:level?',
    name: 'domino',
    component: () => import('@/pages/games/Domino.vue'),
  },
  {
    path: '/gry/porownaj/:level?',
    name: 'compare',
    component: () => import('@/pages/games/Compare.vue'),
  },
  {
    path: '/gry/najwieksza/:level?',
    name: 'biggest',
    component: () => import('@/pages/games/Biggest.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
