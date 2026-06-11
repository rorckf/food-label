<template>
  <button
    :class="['w-btn', `w-btn--${variant}`, `w-btn--${size}`, { 'is-loading': loading, 'is-block': block, 'is-icon': iconOnly }]"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="w-btn__spinner" aria-hidden="true"></span>
    <slot v-else />
  </button>
</template>

<script setup>
defineProps({
  variant: { type: String, default: 'primary' }, // primary | ghost | soft | text
  size: { type: String, default: 'md' },         // sm | md | lg
  type: { type: String, default: 'button' },
  loading: Boolean,
  disabled: Boolean,
  block: Boolean,
  iconOnly: Boolean,
})
defineEmits(['click'])
</script>

<style scoped>
.w-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: var(--w-radius-full);
  font-family: var(--w-font-sans);
  font-weight: 500;
  letter-spacing: 0.03em;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.18s var(--w-ease), box-shadow 0.2s var(--w-ease),
              background-color 0.2s var(--w-ease), color 0.2s var(--w-ease),
              border-color 0.2s var(--w-ease);
  user-select: none;
  border: 1px solid transparent;
}

.w-btn:disabled { cursor: not-allowed; opacity: 0.55; }
.w-btn:not(:disabled):active { transform: translateY(1px); }

.w-btn--sm { height: 32px; padding: 0 16px; font-size: 13px; }
.w-btn--md { height: 42px; padding: 0 22px; font-size: 15px; }
.w-btn--lg { height: 52px; padding: 0 30px; font-size: 16px; }

.w-btn.is-icon { padding: 0; width: var(--_w); height: var(--_w); }
.w-btn--sm.is-icon { --_w: 32px; }
.w-btn--md.is-icon { --_w: 42px; }
.w-btn--lg.is-icon { --_w: 52px; }
.w-btn.is-block { width: 100%; }

/* primary — 琥珀实心 */
.w-btn--primary {
  background: var(--w-primary);
  color: #FFF8EB;
  box-shadow: var(--w-shadow-xs);
}
.w-btn--primary:not(:disabled):hover {
  background: var(--w-primary-hover);
  box-shadow: var(--w-shadow-md);
  transform: translateY(-1px);
}

/* ghost — 描边 */
.w-btn--ghost {
  background: transparent;
  color: var(--w-primary);
  border-color: var(--w-border);
}
.w-btn--ghost:not(:disabled):hover {
  background: var(--w-primary-pale);
  border-color: var(--w-primary);
}

/* soft — 柔和背景 */
.w-btn--soft {
  background: var(--w-primary-soft);
  color: var(--w-primary-hover);
}
.w-btn--soft:not(:disabled):hover { background: var(--w-amber-soft); color: var(--w-ink); }

/* text — 文字按钮 */
.w-btn--text {
  background: transparent;
  color: var(--w-ink-mid);
  padding-left: 10px;
  padding-right: 10px;
}
.w-btn--text:not(:disabled):hover { color: var(--w-primary); background: var(--w-primary-pale); }

.w-btn__spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: w-spin 0.75s linear infinite;
}
</style>
