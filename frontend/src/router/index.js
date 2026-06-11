import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'
import { isLocalMode } from '@/local/appMode'
import { hasLocalProfile } from '@/local/profile'

// 路由懒加载函数
const lazyLoad = (view) => {
  return () => import(`@/views/${view}.vue`)
}

const routes = [
    {
        path: '/',
        name: 'Upload',
        component: lazyLoad('Upload'),
        meta: { requiresAuth: true }
    },
    {
        path: '/result/:id',
        name: 'Result',
        component: lazyLoad('Result'),
        meta: { requiresAuth: true }
    },
    {
        path: '/ingredients-analysis/:id',
        name: 'IngredientsAnalysis',
        component: lazyLoad('IngredientsAnalysis'),
        meta: { requiresAuth: true }
    },
    {
        path: '/product-details/:id',
        name: 'ProductDetails',
        component: lazyLoad('ProductDetails'),
        meta: { requiresAuth: true }
    },
    {
        path: '/history',
        name: 'History',
        component: lazyLoad('HistoryView'),
        meta: { requiresAuth: true }
    },
    {
        // 历史详情复用识读结果页（Result 内部会从后端拉数据填充）
        path: '/history/:id',
        redirect: (to) => ({ name: 'Result', params: { id: to.params.id } })
    },
    {
        // 旧链接重定向到历史记录的"已收藏"筛选
        path: '/favorites',
        redirect: { name: 'History', query: { tab: 'fav' } }
    },
    {
        // 旧链接：个人中心已拆分到 BrandBar 与历史记录
        path: '/profile',
        redirect: { name: 'Preferences' }
    },
    {
        path: '/preferences',
        name: 'Preferences',
        component: lazyLoad('Preferences'),
        meta: { requiresAuth: true }
    },
    {
        path: '/compare',
        name: 'Compare',
        component: lazyLoad('Compare'),
        meta: { requiresAuth: true }
    },
    {
        path: '/recommend',
        name: 'Recommend',
        component: lazyLoad('Recommend'),
        meta: { requiresAuth: true }
    },
    {
        path: '/onboarding',
        name: 'Onboarding',
        component: lazyLoad('HealthProfileSetup'),
        meta: { requiresAuth: true }
    },
    {
        path: '/admin/users',
        name: 'AdminUserList',
        component: () => import('@/views/admin/AdminUserList.vue'),
        meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
        path: '/login',
        name: 'Login',
        component: lazyLoad('Login'),
        meta: { guestOnly: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: lazyLoad('Register'),
        meta: { guestOnly: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫：登录态 + 管理员权限 + 健康档案完善校验
const readUser = () => {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user')
    try { return raw ? JSON.parse(raw) : null } catch { return null }
}

router.beforeEach((to, from, next) => {
    // ── 单机模式(App/BYOK):无账号体系 ──
    if (isLocalMode()) {
        // 登录/注册页与管理后台在单机模式下不存在,一律回首页
        if (to.meta.guestOnly || to.meta.requiresAdmin) {
            return next({ path: '/' })
        }
        // 健康档案引导仍然保留(存本机),完成前强制进入引导页
        if (to.meta.requiresAuth && to.name !== 'Onboarding' && !hasLocalProfile()) {
            return next({ name: 'Onboarding' })
        }
        return next()
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token')

    if (to.meta.requiresAuth && !token) {
        return next({ name: 'Login', query: { redirect: to.fullPath } })
    }
    if (to.meta.guestOnly && token) {
        return next({ path: '/' })
    }

    const user = token ? readUser() : null
    const role = user?.role || 'user'

    // 管理员页面：未登录已上面拦掉，这里只检查角色
    if (to.meta.requiresAdmin && role !== 'admin') {
        ElMessage.warning('无管理员权限')
        return next({ path: '/' })
    }

    // 已登录 + 进入受保护页（除引导页本身）→ 检查健康档案是否完善
    // 管理员豁免：admin 账号无需健康档案
    if (token && to.meta.requiresAuth && to.name !== 'Onboarding' && role !== 'admin') {
        if (!user?.healthGoal) {
            return next({ name: 'Onboarding' })
        }
    }
    next()
})

export default router