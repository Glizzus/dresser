<script setup lang="ts">
import { ref } from 'vue'
import { signInWithEmail } from '@/repo'

const email = ref('')
const sent = ref(false)
const error = ref('')
const busy = ref(false)

async function submit() {
  error.value = ''
  busy.value = true
  try {
    await signInWithEmail(email.value.trim())
    sent.value = true
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Could not send the link.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="center-screen">
    <h1>Dresser</h1>
    <p class="muted">Do I have enough clean clothes at the house I'm in?</p>

    <template v-if="!sent">
      <form @submit.prevent="submit" class="form">
        <input
          v-model="email"
          type="email"
          required
          placeholder="you@example.com"
          autocomplete="email"
          class="input"
        />
        <button class="btn btn-primary" :disabled="busy">
          {{ busy ? 'Sending…' : 'Email me a magic link' }}
        </button>
      </form>
      <p v-if="error" class="err">{{ error }}</p>
    </template>

    <p v-else>
      Check your email for a sign-in link, then return here.
    </p>
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
