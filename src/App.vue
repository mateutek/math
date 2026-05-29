<script setup>
import { ref } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { Infinity as InfinityIcon, Menu } from 'lucide-vue-next'
import settings from '@/store/settings'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const route = useRoute()
const drawer = ref(false)
const year = new Date().getFullYear()

const links = [
  { to: '/dodawanie', title: 'dodawanie' },
  { to: '/odejmowanie', title: 'odejmowanie' },
  { to: '/mnozenie', title: 'mnożenie' },
  { to: '/dzielenie', title: 'Dzielenie' },
  { to: '/dzielenie2', title: 'DzielBezReszty' },
]

function isActive(to) {
  return route.path.startsWith(to)
}
</script>

<template>
  <div id="inspire" class="flex min-h-screen flex-col bg-muted">
    <header class="sticky top-0 z-40 border-b bg-background shadow-sm">
      <div class="container flex h-16 items-center gap-2 px-2 md:px-4">
        <!-- Mobile hamburger + drawer -->
        <Sheet v-model:open="drawer">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="md:hidden" aria-label="Menu">
              <Menu class="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" class="w-64 p-0">
            <SheetHeader class="p-4">
              <SheetTitle class="text-left">Menu</SheetTitle>
            </SheetHeader>
            <nav class="flex flex-col">
              <RouterLink
                v-for="link in links"
                :key="link.to"
                :to="link.to"
                class="px-4 py-3 text-sm uppercase transition-colors hover:bg-accent hover:text-accent-foreground"
                :class="{ 'bg-primary text-primary-foreground hover:bg-primary': isActive(link.to) }"
                @click="drawer = false"
              >
                {{ link.title }}
              </RouterLink>
            </nav>
          </SheetContent>
        </Sheet>

        <!-- Brand -->
        <RouterLink to="/" class="mr-6">
          <Avatar class="h-8 w-8 bg-blue-600">
            <AvatarFallback class="bg-blue-600 text-white">
              <InfinityIcon class="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="hidden items-center gap-1 md:flex">
          <Button
            v-for="link in links"
            :key="link.to"
            as-child
            variant="ghost"
            :class="isActive(link.to) ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''"
          >
            <RouterLink :to="link.to">{{ link.title }}</RouterLink>
          </Button>
        </nav>

        <div class="flex-1" />

        <!-- Timer switch -->
        <div class="flex items-center gap-2">
          <Switch id="timer" v-model:checked="settings.timerEnabled" />
          <label for="timer" class="cursor-pointer text-sm">Zegar</label>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <RouterView />
    </main>

    <footer class="border-t bg-background py-4">
      <div class="text-center text-sm">&copy; Mateusz Woźniak - {{ year }}</div>
    </footer>
  </div>
</template>
