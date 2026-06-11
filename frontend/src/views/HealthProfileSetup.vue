<template>
  <div class="auth-page">
    <div class="auth-bg" aria-hidden="true">
      <span class="auth-bg__mark auth-bg__mark--1">❦</span>
      <span class="auth-bg__mark auth-bg__mark--2">✦</span>
    </div>

    <button type="button" class="logout-btn" @click="handleLogout">
      <LogOut :size="14" />
      <span>退出登录</span>
    </button>

    <div class="onboard-wrap">
      <header class="auth-hero">
        <div class="auth-hero__eyebrow">
          <span class="auth-hero__line"></span>
          <span class="auth-hero__tiny">WELCOME · 完善档案</span>
          <span class="auth-hero__line"></span>
        </div>
        <h1 class="auth-hero__title">你的健康档案</h1>
        <p class="auth-hero__sub">仅需三步，为你生成专属健康食品推荐。</p>
      </header>

      <!-- 1. 健康目标 -->
      <section class="parch-card">
        <header class="parch-card__head">
          <Target :size="16" class="parch-card__icon" />
          <h3 class="parch-card__title">身材目标</h3>
          <span class="parch-card__hint">单选 · 必填</span>
        </header>
        <div class="opts">
          <button
            v-for="opt in GOAL_OPTIONS"
            :key="opt.value"
            type="button"
            class="opt"
            :class="{ 'opt--on': goal === opt.value }"
            @click="goal = opt.value"
          >
            <span class="opt__emoji">{{ opt.emoji }}</span>
            <span class="opt__label">{{ opt.label }}</span>
          </button>
        </div>
      </section>

      <!-- 2. 慢性病 -->
      <section class="parch-card">
        <header class="parch-card__head">
          <Activity :size="16" class="parch-card__icon" />
          <h3 class="parch-card__title">疾病禁忌</h3>
          <span class="parch-card__hint">多选 · 无则点"无"</span>
        </header>
        <div class="opts opts--wrap">
          <button
            v-for="opt in DISEASE_OPTIONS"
            :key="opt"
            type="button"
            class="opt opt--sm"
            :class="{ 'opt--on': diseases.includes(opt) }"
            @click="toggleDisease(opt)"
          >{{ opt }}</button>
        </div>
      </section>

      <!-- 3. 过敏原 -->
      <section class="parch-card">
        <header class="parch-card__head">
          <Wheat :size="16" class="parch-card__icon" />
          <h3 class="parch-card__title">过敏原</h3>
          <span class="parch-card__hint">多选 · 无则点"无"</span>
        </header>
        <div class="opts opts--wrap">
          <button
            v-for="opt in ALLERGEN_OPTIONS"
            :key="opt"
            type="button"
            class="opt opt--sm"
            :class="{ 'opt--on': allergens.includes(opt) }"
            @click="toggleAllergen(opt)"
          >{{ opt }}</button>
        </div>
      </section>

      <button class="primary-btn" :disabled="!canSubmit || saving" @click="submit">
        <Loader v-if="saving" :size="15" class="spin" />
        <Check v-else :size="15" />
        {{ saving ? '保存中…' : '完 成 · 开 始 推 荐' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Target, Activity, Wheat, Check, Loader, LogOut } from 'lucide-vue-next'
import { userAPI } from '@/utils/api'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()
const saving = ref(false)

const handleLogout = async () => {
  try { await userAPI.logout() } catch (e) { /* ignore */ }
  userStore.logout?.()
  router.push('/login')
}

const GOAL_OPTIONS = [
  { value: '减脂', label: '减脂', emoji: '🔥' },
  { value: '增肌', label: '增肌', emoji: '💪' },
  { value: '控糖', label: '控糖', emoji: '🍬' },
  { value: '控压', label: '控压', emoji: '🩺' },
  { value: '通用', label: '通用', emoji: '🌿' },
]
const DISEASE_OPTIONS = ['高血压', '糖尿病', '高血脂', '痛风', '无']
const ALLERGEN_OPTIONS = ['麸质', '蛋', '乳', '大豆', '花生', '坚果', '甲壳类', '鱼', '芝麻', '无']

const goal = ref('')
const diseases = ref([])
const allergens = ref([])

/** "无"与其他互斥的多选切换 */
const toggleExclusive = (list, val, none = '无') => {
  const arr = list.value
  if (val === none) {
    list.value = arr.includes(none) ? [] : [none]
    return
  }
  const without = arr.filter(v => v !== none)
  list.value = without.includes(val)
      ? without.filter(v => v !== val)
      : [...without, val]
}
const toggleDisease = (v) => toggleExclusive(diseases, v)
const toggleAllergen = (v) => toggleExclusive(allergens, v)

const canSubmit = computed(() =>
    goal.value && diseases.value.length > 0 && allergens.value.length > 0
)

const submit = async () => {
  if (!canSubmit.value) return
  saving.value = true
  try {
    const payload = {
      healthGoal: goal.value,
      // "无"被选中时存空字符串，与后端"空表示无"约定一致
      chronicDiseases: diseases.value.includes('无') ? '' : diseases.value.join(','),
      allergens: allergens.value.includes('无') ? '' : allergens.value.join(','),
    }
    const res = await userAPI.updateHealthProfile(payload)
    if (res.code !== 200) {
      ElMessage.error(res.message || '保存失败')
      return
    }
    // 同步 localStorage / sessionStorage 中的 user.healthGoal，避免被守卫重新拦截
    for (const storage of [localStorage, sessionStorage]) {
      const raw = storage.getItem('user')
      if (!raw) continue
      try {
        const u = JSON.parse(raw)
        u.healthGoal = goal.value
        storage.setItem('user', JSON.stringify(u))
      } catch { /* ignore */ }
    }
    ElMessage.success('档案已保存')
    router.push('/recommend')
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '保存失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* 全屏覆盖 BrandBar + Sidebar，与 Login/Register 风格一致 */
.auth-page {
  position: fixed;
  inset: 0;
  z-index: 1500;
  background: var(--w-bg);
  overflow-y: auto;
  display: flex;
  justify-content: center;
}
.auth-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    radial-gradient(circle at 18% 22%, rgba(181, 99, 42, 0.08) 0%, transparent 45%),
    radial-gradient(circle at 82% 78%, rgba(200, 134, 58, 0.08) 0%, transparent 45%);
}
.auth-bg__mark {
  position: absolute;
  color: var(--w-primary-soft);
  opacity: 0.4;
}
.auth-bg__mark--1 { top: 8%; left: 9%; font-size: 42px; }
.auth-bg__mark--2 { bottom: 10%; right: 11%; font-size: 26px; color: var(--w-amber); }

.logout-btn {
  position: absolute;
  top: 18px;
  right: 22px;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-full);
  font-size: 12.5px;
  color: var(--w-ink-mid);
  letter-spacing: 0.08em;
  cursor: pointer;
  box-shadow: var(--w-shadow-sm);
  transition: all 0.18s var(--w-ease);
}
.logout-btn:hover {
  color: var(--w-primary);
  border-color: var(--w-primary);
  transform: translateY(-1px);
}

.onboard-wrap {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 560px;
  padding: var(--w-space-6) var(--w-space-5) var(--w-space-7);
  display: flex;
  flex-direction: column;
  gap: var(--w-space-4);
}

.auth-hero { text-align: center; padding: var(--w-space-2) 0 var(--w-space-3); }
.auth-hero__eyebrow {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; color: var(--w-amber);
  margin-bottom: var(--w-space-3);
}
.auth-hero__line { width: 40px; height: 1px; background: currentColor; opacity: 0.55; }
.auth-hero__tiny { font-size: 11px; letter-spacing: 0.4em; font-weight: 500; }
.auth-hero__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h1);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.1em;
  margin-bottom: var(--w-space-2);
}
.auth-hero__sub {
  color: var(--w-ink-mid);
  font-size: 13.5px;
  line-height: 1.7;
  letter-spacing: 0.05em;
  margin: 0;
}

.parch-card {
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-lg);
  padding: var(--w-space-4) var(--w-space-5);
  box-shadow: var(--w-shadow-sm);
  position: relative;
}
.parch-card::before {
  content: '';
  position: absolute;
  inset: 6px;
  border: 1px dashed var(--w-divider);
  border-radius: calc(var(--w-radius-lg) - 6px);
  pointer-events: none;
}
.parch-card__head {
  display: flex; align-items: center; gap: 10px;
  padding-bottom: var(--w-space-3);
  margin-bottom: var(--w-space-3);
  border-bottom: 1px solid var(--w-divider);
  position: relative; z-index: 1;
}
.parch-card__icon { color: var(--w-amber); }
.parch-card__title {
  font-family: var(--w-font-serif);
  font-size: 16px; font-weight: 500;
  color: var(--w-ink); letter-spacing: 0.1em; margin: 0;
  flex: 1;
}
.parch-card__hint {
  font-size: 11.5px;
  color: var(--w-ink-mute);
  letter-spacing: 0.08em;
}

.opts {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  position: relative; z-index: 1;
}
.opts--wrap {
  display: flex;
  flex-wrap: wrap;
}

.opt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--w-surface-2);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-md);
  font-size: 13.5px;
  color: var(--w-ink-mid);
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.18s var(--w-ease);
}
.opt:hover {
  border-color: var(--w-primary-soft);
  color: var(--w-ink);
}
.opt--on {
  background: var(--w-primary-pale, #FFF4E0);
  border-color: var(--w-primary);
  color: var(--w-primary);
  font-weight: 500;
}
.opt--sm {
  padding: 8px 14px;
  font-size: 13px;
  border-radius: var(--w-radius-full);
}
.opt__emoji { font-size: 16px; }
.opt__label { letter-spacing: 0.08em; }

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 48px;
  margin-top: var(--w-space-3);
  background: var(--w-primary);
  color: #FFFBF2;
  border: 0;
  border-radius: var(--w-radius-full);
  font-family: var(--w-font-serif);
  font-size: 15px;
  letter-spacing: 0.3em;
  padding-left: 0.3em;
  cursor: pointer;
  box-shadow: var(--w-shadow-sm);
  transition: all 0.25s var(--w-ease);
}
.primary-btn:hover:not(:disabled) {
  background: var(--w-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--w-shadow-md);
}
.primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.spin { animation: w-spin 0.8s linear infinite; }
@keyframes w-spin { to { transform: rotate(360deg); } }

@media (max-width: 540px) {
  .opts { grid-template-columns: repeat(2, 1fr); }
}
</style>
