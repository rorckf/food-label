<template>
  <div class="w-tabs">
    <div class="w-tabs__nav" role="tablist">
      <button
        v-for="t in tabs"
        :key="t.value"
        role="tab"
        :aria-selected="modelValue === t.value"
        :class="['w-tabs__tab', { 'is-active': modelValue === t.value }]"
        @click="$emit('update:modelValue', t.value)"
      >
        {{ t.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  tabs: { type: Array, required: true }, // [{ label, value }]
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.w-tabs__nav {
  display: inline-flex;
  padding: 5px;
  gap: 4px;
  background: var(--w-bg-soft);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-full);
}

.w-tabs__tab {
  padding: 9px 22px;
  border-radius: var(--w-radius-full);
  font-family: var(--w-font-sans);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: var(--w-ink-mid);
  transition: all 0.25s var(--w-ease);
  cursor: pointer;
}
.w-tabs__tab:hover { color: var(--w-primary); }
.w-tabs__tab.is-active {
  background: var(--w-surface);
  color: var(--w-primary-hover);
  box-shadow: var(--w-shadow-xs);
}
</style>
