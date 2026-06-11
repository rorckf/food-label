<template>
  <header class="brandbar">
    <div class="brandbar__inner">
      <router-link to="/" class="brandbar__logo">
        <span class="brandbar__mark">🍞</span>
        <span class="brandbar__name">知味<span class="brandbar__en">&nbsp;·&nbsp;FoodLabel</span></span>
      </router-link>
      <div class="brandbar__actions">
        <slot name="actions" />
        <button class="brandbar__theme" @click="toggle" :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'">
          <Sun v-if="isDark" :size="18" />
          <Moon v-else :size="18" />
        </button>

        <el-tooltip
          v-if="userStore.isLoggedIn"
          content="个人偏好"
          placement="bottom"
          :effect="'light'"
        >
          <router-link to="/preferences" class="brandbar__pref" aria-label="个人偏好">
            <Sliders :size="18" />
          </router-link>
        </el-tooltip>

        <el-popover
          v-if="userStore.isLoggedIn"
          placement="bottom-end"
          :width="240"
          trigger="click"
          popper-class="brandbar__popover"
        >
          <template #reference>
            <button class="brandbar__avatar" aria-label="账户">
              {{ avatarLetter }}
            </button>
          </template>
          <div class="account">
            <div class="account__name">{{ username || '未登录' }}</div>
            <div class="account__meta">注册于 {{ joinedAt || '—' }}</div>
            <router-link
              v-if="isAdmin"
              to="/admin/users"
              class="account__admin"
            >
              用户管理（管理员）
            </router-link>
            <button class="account__logout" @click="handleLogout">退出登录</button>
          </div>
        </el-popover>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Moon, Sun, Sliders } from 'lucide-vue-next'
import { userAPI } from '@/utils/api'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const isDark = ref(false)
const profile = ref(null)

const apply = (dark) => {
  if (dark) document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
}

const toggle = () => {
  isDark.value = !isDark.value
  apply(isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const username = computed(() => {
  if (profile.value?.username) return profile.value.username
  try {
    const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}')
    return u.username || userStore.userInfo?.nickname || ''
  } catch (e) { return '' }
})

const joinedAt = computed(() => {
  const t = profile.value?.createTime
  if (!t) return ''
  return String(t).slice(0, 10)
})

const avatarLetter = computed(() => (username.value || 'U').slice(0, 1).toUpperCase())

const isAdmin = computed(() => {
  if (profile.value?.role === 'admin') return true
  try {
    const u = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}')
    return u.role === 'admin'
  } catch { return false }
})

const handleLogout = async () => {
  try { await userAPI.logout() } catch (e) { /* ignore */ }
  userStore.logout?.()
  router.push('/login')
}

onMounted(async () => {
  isDark.value = localStorage.getItem('theme') === 'dark'
  apply(isDark.value)
  if (userStore.isLoggedIn) {
    try {
      const res = await userAPI.getProfile()
      if (res?.code === 200) profile.value = res.data
    } catch (e) { /* ignore */ }
  }
})
</script>

<style scoped>
.brandbar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: var(--w-brandbar-h);
  background: rgba(251, 244, 230, 0.78);
  -webkit-backdrop-filter: saturate(1.2) blur(12px);
  backdrop-filter: saturate(1.2) blur(12px);
  border-bottom: 1px solid var(--w-border-soft);
}

.brandbar__inner {
  height: 100%;
  max-width: var(--w-content-max);
  margin: 0 auto;
  padding: 0 var(--w-space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brandbar__logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--w-ink);
  font-family: var(--w-font-serif);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.08em;
}
.brandbar__mark { font-size: 22px; }
.brandbar__en {
  font-size: 12px;
  letter-spacing: 0.2em;
  color: var(--w-ink-soft);
  font-weight: 400;
}

.brandbar__actions {
  display: flex;
  align-items: center;
  gap: var(--w-space-3);
}

.brandbar__theme {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: var(--w-ink-mid);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s var(--w-ease);
}
.brandbar__theme:hover {
  color: var(--w-primary);
  background: var(--w-primary-pale);
}

.brandbar__pref {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  color: var(--w-ink-mid);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.2s var(--w-ease);
}
.brandbar__pref:hover {
  color: var(--w-primary);
  background: var(--w-primary-pale);
}
.brandbar__pref.router-link-active {
  color: var(--w-primary);
  background: var(--w-primary-pale);
}

.brandbar__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--w-primary-pale);
  color: var(--w-primary);
  font-family: var(--w-font-serif);
  font-size: 15px;
  font-weight: 600;
  border: 1px solid var(--w-border-soft);
  cursor: pointer;
  transition: all 0.2s var(--w-ease);
}
.brandbar__avatar:hover {
  background: var(--w-primary);
  color: #fff;
  border-color: var(--w-primary);
}

.account { padding: 4px 2px; }
.account__name {
  font-family: var(--w-font-serif);
  font-size: 16px;
  color: var(--w-ink);
  letter-spacing: 0.06em;
  margin-bottom: 4px;
}
.account__meta {
  font-size: 12px;
  color: var(--w-ink-mid);
  letter-spacing: 0.04em;
  padding-bottom: 12px;
  border-bottom: 1px dashed var(--w-divider);
  margin-bottom: 10px;
}
.account__admin {
  display: block;
  width: 100%;
  height: 34px;
  line-height: 34px;
  text-align: center;
  border: 1px solid var(--w-amber);
  border-radius: var(--w-radius-full);
  background: transparent;
  color: var(--w-amber);
  font-size: 12.5px;
  letter-spacing: 0.06em;
  text-decoration: none;
  transition: all 0.18s var(--w-ease);
  margin-bottom: 8px;
}
.account__admin:hover {
  background: var(--w-amber);
  color: #FFFBF2;
}

.account__logout {
  width: 100%;
  height: 34px;
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-full);
  background: transparent;
  color: var(--w-ink-mid);
  font-size: 12.5px;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.18s var(--w-ease);
}
.account__logout:hover {
  color: var(--w-terracotta);
  border-color: var(--w-terracotta);
}
</style>
