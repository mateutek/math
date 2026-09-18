import { createRouter, createWebHistory } from 'vue-router'
import Village from '@/pages/Village.vue'
import settings, { classConfig } from '@/store/settings'
import { gameOffered } from '@/data/classes'

const routes = [
  {
    path: '/',
    name: 'village',
    component: Village,
  },
  {
    path: '/klasa',
    name: 'classPicker',
    // `bare` strips the app chrome down to the logo: no counters, no tabs,
    // no side column, the way the ClassPicker board draws it
    meta: { bare: true },
    component: () => import('@/pages/ClassPicker.vue'),
  },
  {
    path: '/graj',
    name: 'play',
    component: () => import('@/pages/Play.vue'),
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
  {
    path: '/gry/kafelki/:level?',
    name: 'tiles',
    component: () => import('@/pages/games/Tiles.vue'),
  },
  {
    path: '/gry/rosnaco/:level?',
    name: 'ascending',
    component: () => import('@/pages/games/Ascending.vue'),
  },
  {
    path: '/gry/brakujaca/:level?',
    name: 'missing',
    component: () => import('@/pages/games/Missing.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// The `:level?` in the paths above is kept only so links shared before the
// class model landed still open; nothing reads its value any more.
// Route names double as game ids, so this also catches a game the class has no
// operation for, such as /mnozenie in class 1.
router.beforeEach((to) => {
  // first run: nothing works until a class is picked
  if (settings.schoolClass === null && to.name !== 'classPicker') return { name: 'classPicker' }
  if (!gameOffered(to.name, classConfig.value)) return '/graj'
})

export default router
