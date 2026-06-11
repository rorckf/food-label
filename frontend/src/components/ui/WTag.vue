<template>
  <span :class="['w-tag', `w-tag--${variant}`, `w-tag--${size}`]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'default' }, // default | primary | sage | warn | risk | outline
  size: { type: String, default: 'md' },
})
</script>

<style scoped>
.w-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: var(--w-radius-full);
  font-family: var(--w-font-sans);
  font-weight: 500;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  line-height: 1;
}
.w-tag--sm { padding: 4px 10px; font-size: 11px; }
.w-tag--md { padding: 6px 14px; font-size: 12px; }
.w-tag--lg { padding: 8px 18px; font-size: 13px; }

.w-tag--default {
  background: var(--w-primary-pale);
  color: var(--w-primary-hover);
  border-color: var(--w-border-soft);
}
.w-tag--primary { background: var(--w-primary); color: #FFF8EB; }
.w-tag--sage    { background: var(--w-sage-soft); color: var(--w-sage); }
.w-tag--warn    { background: var(--w-warn-bg); color: var(--w-warn-text); }
.w-tag--risk    { background: var(--w-risk-bg); color: var(--w-risk-text); }
.w-tag--outline { background: transparent; color: var(--w-ink-mid); border-color: var(--w-border); }
</style>
