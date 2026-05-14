<script setup lang="ts">
import { computed, ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Card from '../components/Card.vue'
import Field from '../components/Field.vue'
import Pill from '../components/Pill.vue'
import Segmented from '../components/Segmented.vue'
import Sheet from '../components/Sheet.vue'
import WearMeter from '../components/WearMeter.vue'
import { CATEGORIES, isClean } from '../lib/data'
import { T } from '../lib/tokens'
import type { Item, Location } from '../lib/types'

const props = defineProps<{
  item?: Item | null
}>()

const emit = defineEmits<{
  close: []
  save: [it: Partial<Item> & { id?: string }]
  delete: [id: string]
  markDirty: [id: string]
  markClean: [id: string]
}>()

const isNew = computed(() => !props.item)

const name = ref(props.item?.name ?? '')
const cats = ref<string[]>([...(props.item?.cats ?? [])])
const loc = ref<Location>(props.item?.loc ?? 'a')
const lim = ref<number>(props.item?.lim ?? 2)

const canSave = computed(() => name.value.trim().length > 0 && cats.value.length > 0)

const toggleCat = (c: string) => {
  cats.value = cats.value.includes(c)
    ? cats.value.filter((x) => x !== c)
    : [...cats.value, c]
}

const onSave = () => {
  if (!canSave.value) return
  emit('save', {
    ...(props.item ?? {}),
    name: name.value.trim(),
    cats: [...cats.value],
    loc: loc.value,
    lim: lim.value,
  })
}

const segmentedOptions = [
  { id: 'a', label: 'House A' },
  { id: 'b', label: 'House B' },
  { id: 'transit', label: 'In transit' },
]
</script>

<template>
  <Sheet height="92%" @close="emit('close')">
    <div
      :style="{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '4px 16px 0',
        alignItems: 'center',
      }"
    >
      <Button label="Cancel" severity="secondary" variant="text" size="small" @click="emit('close')" />
      <Button
        label="Save"
        severity="contrast"
        variant="text"
        size="small"
        :disabled="!canSave"
        @click="onSave"
      />
    </div>

    <div :style="{ padding: '4px 20px 12px' }">
      <div :style="{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px' }">
        {{ isNew ? 'New item' : 'Edit item' }}
      </div>
    </div>

    <div
      class="wt-scroll"
      :style="{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }"
    >
      <Field label="Name">
        <InputText
          v-model="name"
          placeholder="e.g. Grey crew tee"
          fluid
        />
      </Field>

      <Field label="Categories">
        <div :style="{ display: 'flex', flexWrap: 'wrap', gap: '6px' }">
          <Pill
            v-for="c in CATEGORIES"
            :key="c"
            :active="cats.includes(c)"
            size="sm"
            @press="toggleCat(c)"
          >
            {{ c }}
          </Pill>
        </div>
      </Field>

      <Field label="Location">
        <Segmented
          :value="loc"
          :options="segmentedOptions"
          @change="(v) => (loc = v as Location)"
        />
      </Field>

      <Field label="Wear limit" hint="Counts as dirty after this many wears.">
        <InputNumber
          v-model="lim"
          show-buttons
          button-layout="horizontal"
          :min="1"
          :max="12"
          suffix=" wears"
          fluid
          :pt="{ pcInputText: { root: { style: { textAlign: 'center', fontWeight: 700 } } } }"
        >
          <template #incrementbuttonicon>
            <span>+</span>
          </template>
          <template #decrementbuttonicon>
            <span>−</span>
          </template>
        </InputNumber>
      </Field>

      <Field v-if="!isNew && item" label="Current state">
        <Card :padding="14">
          <div
            :style="{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }"
          >
            <div>
              <div :style="{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.2px' }">
                {{ item.w }} / {{ item.lim }} wears
              </div>
              <div :style="{ fontSize: '12.5px', color: T.sub, marginTop: '2px' }">
                {{ isClean(item) ? 'clean' : 'dirty' }}
              </div>
            </div>
            <WearMeter :wears="item.w" :lim="item.lim" />
          </div>
          <div :style="{ marginTop: '12px' }">
            <Button
              v-if="isClean(item)"
              label="Mark dirty"
              severity="danger"
              variant="outlined"
              fluid
              @click="emit('markDirty', item.id)"
            />
            <Button
              v-else
              label="Mark clean"
              severity="success"
              variant="outlined"
              fluid
              @click="emit('markClean', item.id)"
            />
          </div>
        </Card>
      </Field>

      <div
        v-if="!isNew && item"
        :style="{ padding: '12px 0 32px', textAlign: 'center' }"
      >
        <Button
          label="Delete item"
          severity="danger"
          variant="text"
          size="small"
          @click="emit('delete', item.id)"
        />
      </div>
    </div>
  </Sheet>
</template>
