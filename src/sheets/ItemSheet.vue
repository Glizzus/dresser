<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import Drawer from 'primevue/drawer'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import SelectButton from 'primevue/selectbutton'
import Card from '../components/Card.vue'
import CategoryPicker from '../components/CategoryPicker.vue'
import Field from '../components/Field.vue'
import WearMeter from '../components/WearMeter.vue'
import { isClean } from '../lib/data'
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

const visible = ref(true)
watch(visible, (v) => {
  if (!v) emit('close')
})

const isNew = computed(() => !props.item)

const name = ref(props.item?.name ?? '')
const cats = ref<string[]>([...(props.item?.cats ?? [])])
const loc = ref<Location>(props.item?.loc ?? 'a')
const lim = ref<number>(props.item?.lim ?? 2)

const canSave = computed(() => name.value.trim().length > 0 && cats.value.length > 0)

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

const locOptions = [
  { id: 'a', label: 'House A' },
  { id: 'b', label: 'House B' },
  { id: 'transit', label: 'In transit' },
]
</script>

<template>
  <Drawer v-model:visible="visible" position="bottom" class="wt-drawer-tall">
    <div class="wt-sheet-bar">
      <Button label="Cancel" severity="secondary" variant="text" size="small" @click="visible = false" />
      <Button
        label="Save"
        severity="contrast"
        variant="text"
        size="small"
        :disabled="!canSave"
        @click="onSave"
      />
    </div>

    <div class="wt-sheet-title">
      {{ isNew ? 'New item' : 'Edit item' }}
    </div>

    <div class="wt-scroll wt-sheet-scroll">
      <Field label="Name">
        <InputText v-model="name" placeholder="e.g. Grey crew tee" fluid />
      </Field>

      <Field label="Category">
        <CategoryPicker v-model="cats" />
      </Field>

      <Field label="Location">
        <SelectButton
          v-model="loc"
          :options="locOptions"
          option-label="label"
          option-value="id"
          :allow-empty="false"
          fluid
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
        >
          <template #incrementbuttonicon><span>+</span></template>
          <template #decrementbuttonicon><span>−</span></template>
        </InputNumber>
      </Field>

      <Field v-if="!isNew && item" label="Current state">
        <Card :pad="14">
          <div class="wt-item-state-row">
            <div>
              <div class="wt-item-state-line">{{ item.w }} / {{ item.lim }} wears</div>
              <div class="wt-item-state-detail">
                {{ isClean(item) ? 'clean' : 'dirty' }}
              </div>
            </div>
            <WearMeter :wears="item.w" :lim="item.lim" />
          </div>
          <div class="wt-inv-group__body">
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

      <div v-if="!isNew && item" class="wt-item-delete-row">
        <Button
          label="Delete item"
          severity="danger"
          variant="text"
          size="small"
          @click="emit('delete', item.id)"
        />
      </div>
    </div>
  </Drawer>
</template>
