<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getSession, onAuthChange, supabaseConfigured } from '@/repo'
import LoginView from '@/views/LoginView.vue'
import HouseSwitcher from '@/components/HouseSwitcher.vue'
import BottomNav from '@/components/BottomNav.vue'
import ToastHost from '@/components/ToastHost.vue'

const router = useRouter()
const ready = ref(false)
const signedIn = ref(false)
let stop: (() => void) | undefined

onMounted(async () => {
  signedIn.value = Boolean(await getSession())
  ready.value = true
  stop = onAuthChange((isIn) => {
    signedIn.value = isIn
  })
})
onUnmounted(() => stop?.())

function closeSheet() {
  // Sheets are routes; closing returns to the underlying tab.
  if (window.history.state?.back) router.back()
  else router.replace('/inventory')
}
</script>

<template>
  <div v-if="!supabaseConfigured" class="center-screen">
    <h1>Dresser</h1>
    <p class="muted">
      Supabase isn't configured. Copy <code>.env.example</code> to
      <code>.env.local</code>, fill in your project URL and anon key, then
      restart the dev server. See the README.
    </p>
  </div>

  <div v-else-if="!ready" class="center-screen">
    <p class="muted">Loading…</p>
  </div>

  <LoginView v-else-if="!signedIn" />

  <div v-else class="app">
    <HouseSwitcher />
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>
    <BottomNav />

    <!-- Sheets as routes: a slide-up overlay above the current tab. -->
    <router-view name="sheet" v-slot="{ Component }">
      <Transition name="fade">
        <div v-if="Component" class="sheet-backdrop" @click.self="closeSheet">
          <Transition name="sheet" appear>
            <div class="sheet-panel">
              <component :is="Component" @close="closeSheet" />
            </div>
          </Transition>
        </div>
      </Transition>
    </router-view>

    <ToastHost />
  </div>
</template>

<style scoped>
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 20, 18, 0.32);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
}
.sheet-panel {
  background: var(--bg);
  width: 100%;
  max-width: 560px;
  max-height: 92vh;
  overflow-y: auto;
  border-radius: 18px 18px 0 0;
  padding: 8px 16px calc(20px + env(safe-area-inset-bottom));
}
code {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 1px 5px;
  font-size: 0.85em;
}
</style>
