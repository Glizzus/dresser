<script setup lang="ts">
import { computed, ref, watch } from 'vue'

type Region = 'top' | 'bottom' | 'layer' | 'socks' | 'underwear'
type UseCase = 'everyday' | 'church' | 'athletic' | 'sleep'

const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ 'update:modelValue': [cats: string[]] }>()

const REGION_USES: Record<Region, Partial<Record<UseCase, string>>> = {
  top: {
    everyday: 'Normal Shirts',
    church: 'Church Shirts',
    athletic: 'Athletic Shirts',
    sleep: 'Pajama Shirts',
  },
  bottom: {
    everyday: 'Normal Pants',
    church: 'Church Pants',
    athletic: 'Athletic Shorts',
    sleep: 'Pajama Pants',
  },
  layer: {},
  socks: {},
  underwear: {},
}

const SINGLETON_CAT: Record<Region, string | null> = {
  top: null,
  bottom: null,
  layer: 'Undershirts',
  socks: 'Socks',
  underwear: 'Underwear',
}

const REGIONS: { id: Region; label: string; hint: string }[] = [
  { id: 'top', label: 'Top', hint: 'Shirts, tees, tanks' },
  { id: 'bottom', label: 'Bottom', hint: 'Pants, shorts' },
  { id: 'layer', label: 'Layer', hint: 'Undershirts' },
  { id: 'socks', label: 'Socks', hint: '' },
  { id: 'underwear', label: 'Underwear', hint: '' },
]

const USES: { id: UseCase; label: string; hint: string }[] = [
  { id: 'everyday', label: 'Everyday', hint: 'Out and about' },
  { id: 'church', label: 'Church', hint: 'Dress occasions' },
  { id: 'athletic', label: 'Athletic', hint: 'Gym, sport' },
  { id: 'sleep', label: 'Sleep', hint: 'Pajamas, lounge' },
]

function deriveRegion(cats: string[]): Region | null {
  for (const r of ['top', 'bottom'] as Region[]) {
    const mapped = Object.values(REGION_USES[r])
    if (cats.some((c) => mapped.includes(c))) return r
  }
  for (const r of ['layer', 'socks', 'underwear'] as Region[]) {
    if (SINGLETON_CAT[r] && cats.includes(SINGLETON_CAT[r]!)) return r
  }
  return null
}

// Region is held locally so that picking Top/Bottom without a use selected
// doesn't get erased by a round-trip through the (empty) cats array.
const region = ref<Region | null>(deriveRegion(props.modelValue))

watch(
  () => props.modelValue,
  (v) => {
    const r = deriveRegion(v)
    if (r) region.value = r
  },
)

const hasUses = computed(
  () => region.value === 'top' || region.value === 'bottom',
)

const uses = computed<UseCase[]>(() => {
  if (!region.value || !hasUses.value) return []
  const map = REGION_USES[region.value]
  return (Object.keys(map) as UseCase[]).filter((u) =>
    props.modelValue.includes(map[u]!),
  )
})

function setRegion(r: Region) {
  if (region.value === r) return
  region.value = r
  if (SINGLETON_CAT[r]) {
    emit('update:modelValue', [SINGLETON_CAT[r]!])
  } else {
    emit('update:modelValue', [])
  }
}

function toggleUse(u: UseCase) {
  if (!region.value || !hasUses.value) return
  const cat = REGION_USES[region.value][u]
  if (!cat) return
  const next = props.modelValue.includes(cat)
    ? props.modelValue.filter((c) => c !== cat)
    : [...props.modelValue, cat]
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="wt-catpick">
    <div class="wt-catpick__grid">
      <button
        v-for="r in REGIONS"
        :key="r.id"
        type="button"
        class="wt-catpick__tile"
        :class="[
          region === r.id && 'wt-catpick__tile--active',
          r.id === 'underwear' && 'wt-catpick__tile--wide',
        ]"
        @click="setRegion(r.id)"
      >
        <span class="wt-catpick__tile-label">{{ r.label }}</span>
        <span v-if="r.hint" class="wt-catpick__tile-hint">{{ r.hint }}</span>
      </button>
    </div>

    <Transition name="wt-catpick-reveal">
      <div v-if="hasUses" class="wt-catpick__uses">
        <div class="wt-catpick__uses-label">Wear it for…</div>
        <div class="wt-catpick__uses-grid">
          <button
            v-for="u in USES"
            :key="u.id"
            type="button"
            class="wt-catpick__use"
            :class="uses.includes(u.id) && 'wt-catpick__use--active'"
            @click="toggleUse(u.id)"
          >
            <span class="wt-catpick__use-label">{{ u.label }}</span>
            <span class="wt-catpick__use-hint">{{ u.hint }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
