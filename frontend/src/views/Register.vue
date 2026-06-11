<template>
  <div class="auth-page">
    <!-- 背景装饰 -->
    <div class="auth-bg" aria-hidden="true">
      <span class="auth-bg__mark auth-bg__mark--1">🍞</span>
      <span class="auth-bg__mark auth-bg__mark--2">❦</span>
      <span class="auth-bg__mark auth-bg__mark--3">✦</span>
    </div>

    <div class="auth-page__inner">
    <!-- 页首 -->
    <header class="auth-hero">
      <div class="auth-hero__eyebrow">
        <span class="auth-hero__line"></span>
        <span class="auth-hero__tiny">SIGN UP · 启卷伊始</span>
        <span class="auth-hero__line"></span>
      </div>
      <h1 class="auth-hero__title">创建账号</h1>
      <p class="auth-hero__sub">只需数笔签名，便可启程识读。</p>
    </header>

    <!-- 卡片 -->
    <section class="auth-card">
      <form class="auth-form" @submit.prevent="handleRegister">
        <div class="field">
          <label class="field__label" for="reg-username">账号</label>
          <div class="field__control">
            <User :size="16" class="field__icon" />
            <input
              id="reg-username"
              v-model="form.username"
              type="text"
              autocomplete="username"
              placeholder="4–16 位字母或数字"
              class="field__input"
            />
          </div>
        </div>

        <div class="field">
          <label class="field__label" for="reg-email">邮箱（可选）</label>
          <div class="field__control">
            <Mail :size="16" class="field__icon" />
            <input
              id="reg-email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="例如 you@example.com"
              class="field__input"
            />
          </div>
        </div>

        <div class="field">
          <label class="field__label" for="reg-password">密码</label>
          <div class="field__control">
            <Lock :size="16" class="field__icon" />
            <input
              id="reg-password"
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="至少 6 位"
              class="field__input"
            />
            <button
              type="button"
              class="field__toggle"
              :aria-label="showPwd ? '隐藏密码' : '显示密码'"
              @click="showPwd = !showPwd"
            >
              <Eye v-if="showPwd" :size="16" />
              <EyeOff v-else :size="16" />
            </button>
          </div>
          <div class="pwd-meter" v-if="form.password">
            <span class="pwd-meter__bar" :style="{ width: pwdScore.width, background: pwdScore.color }"></span>
            <em class="pwd-meter__label" :style="{ color: pwdScore.color }">{{ pwdScore.label }}</em>
          </div>
        </div>

        <div class="field">
          <label class="field__label" for="reg-password2">确认密码</label>
          <div class="field__control" :class="{ 'has-error': mismatch }">
            <Lock :size="16" class="field__icon" />
            <input
              id="reg-password2"
              v-model="form.password2"
              :type="showPwd ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="再次输入密码"
              class="field__input"
            />
          </div>
          <p v-if="mismatch" class="field__hint field__hint--err">两次输入的密码不一致</p>
        </div>

        <button type="submit" class="primary-btn" :disabled="loading">
          <Loader v-if="loading" :size="15" class="spin" />
          <UserPlus v-else :size="15" />
          {{ loading ? '正在创建…' : '创 建 账 号' }}
        </button>

        <div class="or-divider" aria-hidden="true">
          <span></span><span class="or-divider__mark">❦</span><span></span>
        </div>

        <p class="auth-foot">
          已有账号？
          <router-link to="/login" class="text-link">返回登录</router-link>
        </p>
      </form>
    </section>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Mail, Lock, Eye, EyeOff, UserPlus, Loader } from 'lucide-vue-next'
import { userAPI } from '@/utils/api'

const router = useRouter()
const loading = ref(false)
const showPwd = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  password2: '',
})

const mismatch = computed(() =>
  form.password2.length > 0 && form.password !== form.password2
)

const pwdScore = computed(() => {
  const p = form.password
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) score++
  if (/\d/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  const map = [
    { label: '太短',   width: '15%', color: 'var(--w-terracotta)' },
    { label: '较弱',   width: '30%', color: 'var(--w-terracotta)' },
    { label: '一般',   width: '55%', color: 'var(--w-amber)' },
    { label: '良好',   width: '75%', color: 'var(--w-amber)' },
    { label: '强',     width: '90%', color: 'var(--w-sage)' },
    { label: '非常强', width: '100%', color: 'var(--w-sage)' },
  ]
  return map[score] || map[0]
})

const validate = () => {
  if (!/^[A-Za-z0-9_]{4,16}$/.test(form.username.trim())) {
    ElMessage.warning('账号需 4–16 位字母、数字或下划线')
    return false
  }
  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    ElMessage.warning('邮箱格式有误')
    return false
  }
  if (form.password.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return false
  }
  if (form.password !== form.password2) {
    ElMessage.warning('两次输入的密码不一致')
    return false
  }
  return true
}

const handleRegister = async () => {
  if (!validate()) return
  loading.value = true
  try {
    const payload = {
      username: form.username.trim(),
      password: form.password,
    }
    if (form.email) payload.email = form.email.trim()

    const res = await userAPI.register(payload)
    if (res.code === 200) {
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } else {
      ElMessage.error(res.message || '注册失败')
    }
  } catch (err) {
    ElMessage.error(err?.response?.data?.message || '注册失败，请重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* 全屏覆盖 BrandBar + Sidebar */
.auth-page {
  position: fixed;
  inset: 0;
  z-index: 1500;
  background: var(--w-bg);
  overflow-y: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-page__inner {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 520px;
  padding: var(--w-space-6) var(--w-space-5);
}

/* ── 背景装饰 ── */
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
  opacity: 0.45;
  user-select: none;
  animation: w-float-slow 9s ease-in-out infinite;
}
.auth-bg__mark--1 { top: 12%; left: 10%; font-size: 48px; }
.auth-bg__mark--2 { bottom: 14%; right: 12%; font-size: 42px; animation-delay: -3s; }
.auth-bg__mark--3 { top: 62%; left: 8%; font-size: 22px; animation-delay: -6s; color: var(--w-amber); }
@keyframes w-float-slow {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50%      { transform: translateY(-14px) rotate(4deg); }
}

/* ── Hero ── */
.auth-hero { text-align: center; padding: var(--w-space-3) 0 var(--w-space-5); }
.auth-hero__eyebrow {
  display: flex; align-items: center; justify-content: center;
  gap: 14px; color: var(--w-amber);
  margin-bottom: var(--w-space-4);
}
.auth-hero__line { width: 40px; height: 1px; background: currentColor; opacity: 0.55; }
.auth-hero__tiny { font-size: 11px; letter-spacing: 0.4em; font-weight: 500; }
.auth-hero__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h1);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.1em;
  margin-bottom: var(--w-space-3);
}
.auth-hero__sub {
  color: var(--w-ink-mid);
  font-size: 14px;
  line-height: 1.8;
  letter-spacing: 0.05em;
}

/* ── 卡片 ── */
.auth-card {
  position: relative;
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-xl);
  padding: var(--w-space-6) var(--w-space-7);
  box-shadow: var(--w-shadow-md);
}
.auth-card::before {
  content: '';
  position: absolute;
  inset: 8px;
  border: 1px dashed var(--w-divider);
  border-radius: calc(var(--w-radius-xl) - 8px);
  pointer-events: none;
}

.auth-form {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: var(--w-space-4);
}

/* ── Field ── */
.field { display: flex; flex-direction: column; gap: 8px; }
.field__label {
  font-family: var(--w-font-serif);
  font-size: 13px;
  color: var(--w-ink-mid);
  letter-spacing: 0.14em;
  padding-left: 2px;
}

.field__control {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  background: var(--w-surface-2);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-md);
  transition: all 0.2s var(--w-ease);
}
.field__control:focus-within {
  border-color: var(--w-primary);
  background: var(--w-surface);
  box-shadow: 0 0 0 3px var(--w-primary-pale);
}
.field__control.has-error {
  border-color: var(--w-terracotta);
  box-shadow: 0 0 0 3px var(--w-risk-bg);
}

.field__icon { color: var(--w-ink-soft); flex-shrink: 0; }

.field__input {
  flex: 1;
  height: 44px;
  background: transparent;
  border: 0;
  outline: none;
  font-size: 14px;
  color: var(--w-ink);
  letter-spacing: 0.04em;
  font-family: var(--w-font-sans);
}
.field__input::placeholder { color: var(--w-ink-mute); }

.field__toggle {
  color: var(--w-ink-soft);
  padding: 4px;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s var(--w-ease);
}
.field__toggle:hover { color: var(--w-primary); }

.field__hint { font-size: 12px; color: var(--w-ink-soft); padding-left: 2px; }
.field__hint--err { color: var(--w-risk-text); }

/* ── 密码强度 ── */
.pwd-meter {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 2px 0;
  font-size: 12px;
  color: var(--w-ink-soft);
}
.pwd-meter__bar {
  display: block;
  height: 4px;
  border-radius: 4px;
  background: var(--w-border-soft);
  transition: width 0.25s var(--w-ease), background 0.25s var(--w-ease);
  flex: 1;
  max-width: 180px;
}
.pwd-meter__label {
  font-style: italic;
  letter-spacing: 0.1em;
}

.text-link {
  color: var(--w-primary);
  text-decoration: underline dotted;
  text-underline-offset: 4px;
  transition: color 0.2s var(--w-ease);
}
.text-link:hover { color: var(--w-primary-hover); }

/* ── 按钮 ── */
.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 46px;
  margin-top: var(--w-space-2);
  background: var(--w-primary);
  color: #FFFBF2;
  border-radius: var(--w-radius-full);
  font-family: var(--w-font-serif);
  font-size: 15px;
  letter-spacing: 0.3em;
  padding-left: 0.3em;
  box-shadow: var(--w-shadow-sm);
  transition: all 0.25s var(--w-ease);
}
.primary-btn:hover:not(:disabled) {
  background: var(--w-primary-hover);
  transform: translateY(-1px);
  box-shadow: var(--w-shadow-md);
}
.primary-btn:disabled { opacity: 0.7; cursor: not-allowed; }

.spin { animation: w-spin 0.8s linear infinite; }
@keyframes w-spin { to { transform: rotate(360deg); } }

/* ── 分隔 ── */
.or-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--w-space-3);
  color: var(--w-amber);
  margin: var(--w-space-3) 0;
}
.or-divider span:first-child,
.or-divider span:last-child {
  flex: 1; height: 1px;
  background: currentColor;
  opacity: 0.35;
}
.or-divider__mark { font-size: 16px; opacity: 0.85; }

/* ── 底部 ── */
.auth-foot {
  text-align: center;
  color: var(--w-ink-mid);
  font-size: 13px;
  letter-spacing: 0.04em;
}

@media (max-width: 480px) {
  .auth-page__inner { padding: var(--w-space-5) var(--w-space-4); }
  .auth-card { padding: var(--w-space-5) var(--w-space-4); }
  .auth-bg__mark--1 { font-size: 36px; }
  .auth-bg__mark--2 { font-size: 32px; }
}
</style>
