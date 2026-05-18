<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useItems } from '@/queries'
import { useUiStore } from '@/stores/ui'
import { evaluateStatus } from '@engine/engine.ts'
import { DEFAULT_INVARIANTS } from '@engine/invariants.ts'
import StatusCard from '@/components/StatusCard.vue'
import SectionLabel from '@/components/SectionLabel.vue'

const router = useRouter()
const ui = useUiStore()
const { data: items, isLoading } = useItems()

const status = computed(() =>
  evaluateStatus(DEFAULT_INVARIANTS, items.value ?? [], ui.currentHouse),
)
const allHolding = computed(() => status.value.brokenCount === 0)
const hamperCount = computed(() =>
  status.value.hamper.reduce(
    (n, g) => n + g.items.length,
    0,
  ),
)
</script>

<template>
  <div class="scroll">
    <p v-if="isLoading" class="muted">Loading…</p>

    <template v-else>
      <div class="banner" :class="{ ok: allHolding }">
        <strong v-if="allHolding">All holding</strong>
        <strong v-else>
          {{ status.brokenCount }} invariant{{
            status.brokenCount === 1 ? '' : 's'
          }}
          broken
        </strong>
        <span class="sub">House {{ ui.currentHouse }}</span>
      </div>

      <template v-if="status.broken.length">
        <SectionLabel
          text="Broken"
          :count="status.broken.length"
          accent
        />
        <StatusCard
          v-for="r in status.broken"
          :key="r.id"
          :result="r"
        />
      </template>

      <template v-if="status.holding.length">
        <SectionLabel text="Holding" :count="status.holding.length" />
        <StatusCard
          v-for="r in status.holding"
          :key="r.id"
          :result="r"
        />
      </template>

      <SectionLabel text="Hamper" :count="hamperCount" />
      <p v-if="hamperCount === 0" class="muted">Hamper is empty.</p>
      <div v-for="g in status.hamper" :key="g.category" class="hgroup">
        <div class="hcat">{{ g.category }}</div>
        <div class="hitems">
          {{ g.items.map((i) => i.name).join(', ') }}
        </div>
      </div>

      <button
        class="btn btn-primary laundry"
        @click="router.push('/status/laundry')"
      >
        Did laundry at House {{ ui.currentHouse }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.banner {
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 8px 0 4px;
}
.banner.ok {
  background: var(--surface);
  border-color: var(--line);
}
.banner strong {
  font-size: 1.1rem;
}
.sub {
  color: var(--ink-soft);
  font-size: 0.85rem;
}
.hgroup {
  display: flex;
  gap: 10px;
  padding: 8px 2px;
  border-bottom: 1px solid var(--line);
}
.hcat {
  font-size: 0.85rem;
  color: var(--ink-soft);
  min-width: 110px;
}
.hitems {
  flex: 1;
  font-size: 0.9rem;
}
.laundry {
  width: 100%;
  margin-top: 24px;
}
</style>
