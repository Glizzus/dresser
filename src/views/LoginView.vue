<script setup lang="ts">
import { ref } from 'vue'
import { signIn } from '@/repo'

const email = ref('')
const password = ref('')
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await signIn(email.value.trim(), password.value)
    // On success the auth state change flips App.vue to the app — no UI here.
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not sign in.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="center-screen">
    <h1>Dresser</h1>
    <p class="muted">Do I have enough clean clothes at the house I'm in?</p>

    <form @submit.prevent="submit" class="form">
      <input
        v-model="email"
        type="email"
        required
        placeholder="you@example.com"
        autocomplete="email"
        class="input"
      />
      <input
        v-model="password"
        type="password"
        required
        placeholder="Password"
        autocomplete="current-password"
        class="input"
      />
      <button class="btn btn-primary" :disabled="busy">
        {{ busy ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 320px;
}
.input {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: var(--radius);
  padding: 12px 14px;
  min-height: var(--tap);
}
.err {
  color: var(--accent);
}
</style>
