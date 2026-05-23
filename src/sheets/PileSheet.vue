<script setup lang="ts">
// Edit the TOTAL size of a pile — i.e. how many you own. This is the "I bought
// more underwear" / "I threw some out" flow, deliberately separated from the
// everyday clean/dirty stepper on the row.
//
// Raising the total adds CLEAN units (you just bought them). Lowering it trims
// from the clean stack first; only once total drops below the dirty count does
// dirty follow it down — you can't have more dirty than you own.
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { usePiles, useSetPileCounts } from '@/queries'
import type { AppPile } from '@/lib/types'

const emit = defineEmits<{ close: [] }>()
const route = useRoute()

const { data: piles } = usePiles()
const setCounts = useSetPileCounts()

const id = computed(() => String(route.params.id))
const pile = computed<AppPile | undefined>(() =>
  piles.value?.find((p) => p.id === id.value),
)

const total = ref(0)
watchEffect(() => {
  if (pile.value) total.value = pile.value.total
})

// Preview how clean/dirty land at the chosen total, mirroring the save rule.
const nextDirty = computed(() =>
  Math.min(pile.value?.dirty ?? 0, total.value),
)
const nextClean = computed(() => total.value - nextDirty.value)

async function save() {
  if (!pile.value) return
  await setCounts.mutateAsync({
    id: id.value,
    patch: { total: total.value, dirty: nextDirty.value },
  })
  emit('close')
}
</script>

<template>
  <div class="sheet">
    <div class="grab" />
    <div class="head">
      <h2>{{ pile?.kind ?? 'Pile' }} · total</h2>
      <button class="x" @click="emit('close')">Cancel</button>
    </div>

    <p class="muted intro">How many of these do you own at this house?</p>

    <div class="stepper">
      <button
        type="button"
        :disabled="total <= 0"
        aria-label="One fewer"
        @click="total = Math.max(0, total - 1)"
      >
        &minus;
      </button>
      <span class="value">{{ total }}</span>
      <button type="button" aria-label="One more" @click="total++">+</button>
    </div>

    <p class="muted preview">
      That leaves <strong>{{ nextClean }}</strong> clean and
      <strong>{{ nextDirty }}</strong> dirty.
    </p>

    <button
      class="btn btn-primary save"
      :disabled="setCounts.isPending.value"
      @click="save"
    >
      Save
    </button>
  </div>
</template>

<style scoped>
.sheet {
  padding-bottom: 8px;
}
.grab {
  width: 38px;
  height: 4px;
  border-radius: 2px;
  background: var(--line);
  margin: 6px auto 10px;
}
.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.x {
  border: none;
  background: none;
  color: var(--ink-soft);
}
.intro {
  margin: 0 0 16px;
}
.stepper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}
.stepper button {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--line);
  background: var(--surface);
  font-size: 1.3rem;
}
.stepper button[disabled] {
  color: var(--line);
}
.value {
  font-size: 1.6rem;
  font-variant-numeric: tabular-nums;
  min-width: 40px;
  text-align: center;
}
.preview {
  text-align: center;
  margin: 16px 0 0;
}
.save {
  width: 100%;
  margin-top: 24px;
}
</style>
