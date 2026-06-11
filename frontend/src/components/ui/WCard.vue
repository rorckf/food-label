<template>
  <section :class="['w-card', { 'is-hoverable': hoverable, 'is-flush': flush }]">
    <header v-if="$slots.header || title" class="w-card__head">
      <div class="w-card__title-row">
        <span v-if="$slots.icon" class="w-card__icon"><slot name="icon" /></span>
        <h3 v-if="title" class="w-card__title">{{ title }}</h3>
        <slot name="header" />
      </div>
      <div v-if="$slots.extra" class="w-card__extra"><slot name="extra" /></div>
    </header>
    <div class="w-card__body"><slot /></div>
    <footer v-if="$slots.footer" class="w-card__foot"><slot name="footer" /></footer>
  </section>
</template>

<script setup>
defineProps({
  title: String,
  hoverable: Boolean,
  flush: Boolean,
})
</script>

<style scoped>
.w-card {
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-lg);
  box-shadow: var(--w-shadow-sm);
  overflow: hidden;
  transition: transform 0.35s var(--w-ease-out), box-shadow 0.35s var(--w-ease-out);
  display: flex;
  flex-direction: column;
}

.w-card.is-hoverable:hover {
  transform: translateY(-3px);
  box-shadow: var(--w-shadow-md);
  border-color: var(--w-border);
}

.w-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--w-space-3);
  padding: var(--w-space-5) var(--w-space-6) var(--w-space-3);
}

.w-card__title-row {
  display: flex;
  align-items: center;
  gap: var(--w-space-3);
  min-width: 0;
}

.w-card__icon {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--w-primary-pale);
  color: var(--w-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.w-card__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h3);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.04em;
  margin: 0;
}

.w-card__body {
  padding: var(--w-space-4) var(--w-space-6) var(--w-space-6);
  flex: 1;
}

.w-card.is-flush .w-card__head,
.w-card.is-flush .w-card__body,
.w-card.is-flush .w-card__foot { padding: 0; }

.w-card__foot {
  padding: var(--w-space-4) var(--w-space-6);
  border-top: 1px dashed var(--w-divider);
  background: var(--w-surface-2);
}
</style>
