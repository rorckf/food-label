import axios from 'axios'
import { ElMessage } from 'element-plus'
import { isLocalMode } from '@/local/appMode'

// ───── 单机模式(BYOK)路由 ─────
// isLocalMode() 为 true 时,识别/历史/添加剂等请求不走后端,
// 改走 src/local/ 下的本地实现(动态 import,server 模式零开销)。
// 本地实现统一包装成与后端 Result 相同的 {code, message, data} 结构。
const ok = (data) => ({ code: 200, message: 'ok', data })
const fail = (message) => ({ code: 500, message, data: null })

/** 把本地实现的异常翻译成与拦截器一致的用户提示 */
function localErr(e) {
  const msg = e?.name === 'NoApiKeyError'
    ? '请先在「偏好设置」中配置你的 API Key'
    : e?.name === 'NotFoodLabelError'
      ? `这张图好像不是食品标签：${e.message}`
      : (e?.message || '操作失败')
  ElMessage.error(msg)
  return fail(msg)
}

// 创建 axios 实例（JWT 鉴权，无需 cookie）
export const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器：自动附带 Authorization: Bearer <token>
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    // silent: true 的请求不弹错误提示
    if (!error.config?.silent) {
      const message = error.response?.data?.message || error.message || '请求失败'
      ElMessage.error(message)
    }

    return Promise.reject(error)
  }
)

// 用户相关 API（单机模式:无账号体系,健康档案存本机）
export const userAPI = {
  login: (data) => api.post('/user/login', data),
  register: (data) => api.post('/user/register', data),
  logout: async () => {
    if (isLocalMode()) return ok(null)
    return api.post('/user/logout')
  },
  getProfile: async () => {
    if (isLocalMode()) {
      const m = await import('@/local/profile')
      const p = m.getLocalProfile() || {}
      return ok({ id: 0, username: '本机用户', role: 'user', status: 1, ...p })
    }
    return api.get('/user/profile')
  },
  updateProfile: (data) => api.put('/user/profile', data),
  getHealthProfile: async () => {
    if (isLocalMode()) {
      const m = await import('@/local/profile')
      return ok(m.getLocalProfile() || { healthGoal: null, chronicDiseases: '', allergens: '' })
    }
    return api.get('/user/health-profile')
  },
  updateHealthProfile: async (data) => {
    if (isLocalMode()) {
      const m = await import('@/local/profile')
      return ok(m.saveLocalProfile(data))
    }
    return api.put('/user/health-profile', data)
  },
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/user/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// ───── 大模型配置（前端本地，每人用自己的 Key）─────
const LLM_CONFIG_KEY = 'llmConfig'

/** 默认值：仅作占位提示，实际以后端 application.yml 为最终兜底 */
export const LLM_DEFAULTS = {
  model: 'qwen-vl-plus',
  endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation'
}

/** 读取本地保存的大模型配置 { apiKey, model, endpoint } */
export function getLlmConfig() {
  try {
    const raw = localStorage.getItem(LLM_CONFIG_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** 保存大模型配置到 localStorage */
export function saveLlmConfig(cfg) {
  localStorage.setItem(LLM_CONFIG_KEY, JSON.stringify(cfg || {}))
}

/** 清空大模型配置 */
export function clearLlmConfig() {
  localStorage.removeItem(LLM_CONFIG_KEY)
}

// 识别相关 API（后端：/recognize/upload；单机模式：BYOK 直连阿里云,支持同包装多图）
export const recognizeAPI = {
  uploadImage: async (fileOrFiles) => {
    if (isLocalMode()) {
      try {
        const { localRecognize } = await import('@/local/recognizeFlow')
        return ok(await localRecognize(fileOrFiles))
      } catch (e) {
        return localErr(e)
      }
    }
    // 网页版后端接口暂只支持单图,多图时取第一张
    const file = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles
    const formData = new FormData()
    formData.append('file', file)

    // 把本地配置的大模型参数通过请求头透传给后端（仅非空时附带）
    const llm = getLlmConfig()
    const headers = { 'Content-Type': 'multipart/form-data' }
    if (llm.apiKey)   headers['X-LLM-Api-Key'] = llm.apiKey
    if (llm.model)    headers['X-LLM-Model'] = llm.model
    if (llm.endpoint) headers['X-LLM-Endpoint'] = llm.endpoint

    return api.post('/recognize/upload', formData, {
      headers,
      timeout: 60000 // 多模态调用较慢，给 60s
    })
  },

  /** 配料表「翻译成人话」：把识别结果发给后端，调大模型生成大白话点评 */
  explain: async (payload) => {
    if (isLocalMode()) {
      try {
        const { localExplain } = await import('@/local/recognizeFlow')
        return ok(await localExplain(payload))
      } catch (e) {
        return localErr(e)
      }
    }
    const llm = getLlmConfig()
    const headers = {}
    if (llm.apiKey)   headers['X-LLM-Api-Key'] = llm.apiKey
    if (llm.model)    headers['X-LLM-Model'] = llm.model
    if (llm.endpoint) headers['X-LLM-Endpoint'] = llm.endpoint
    return api.post('/recognize/explain', payload, { headers, timeout: 60000 })
  }
}

// 兼容旧引用：scanAPI 仍可用，内部走 recognizeAPI
export const scanAPI = {
  uploadImage: recognizeAPI.uploadImage
}

// 历史记录 API
export const historyAPI = {
  getHistoryList: async () => {
    if (isLocalMode()) {
      const m = await import('@/local/history')
      return ok(m.listLocalHistory())
    }
    return api.get('/history/list')
  },
  getHistoryDetail: async (id) => {
    if (isLocalMode()) {
      const m = await import('@/local/history')
      const detail = m.getLocalHistoryDetail(id)
      return detail ? ok(detail) : fail('记录不存在')
    }
    return api.get(`/history/detail/${id}`)
  },
  deleteHistory: async (id) => {
    if (isLocalMode()) {
      const m = await import('@/local/history')
      return m.deleteLocalHistory(id) ? ok(null) : fail('记录不存在')
    }
    return api.delete(`/history/delete/${id}`)
  },
  toggleFavorite: async (id) => {
    if (isLocalMode()) {
      const m = await import('@/local/history')
      const isFavorite = m.toggleLocalFavorite(id)
      return isFavorite == null ? fail('记录不存在') : ok({ isFavorite })
    }
    return api.post(`/history/favorite/${id}`)
  }
}

// 添加剂查询 API（模块四；单机模式走本地 GB 2760 知识库）
export const additiveAPI = {
  getDetail: async (name) => {
    if (isLocalMode()) {
      const m = await import('@/local/additiveDb')
      return ok(m.getAdditiveInfo(name))
    }
    return api.get('/additive/detail', { params: { name } })
  },
  classify: async (ingredients) => {
    if (isLocalMode()) {
      const m = await import('@/local/additiveDb')
      return ok(m.classifyIngredients(ingredients))
    }
    return api.post('/additive/classify', { ingredients })
  },
  /** GB 2760-2024 食品×限量明细（深度解析用） */
  getLimits: async (name) => {
    if (isLocalMode()) {
      const m = await import('@/local/additiveDb')
      return ok(await m.getLimitsByName(name))
    }
    return api.get('/additive/limits', { params: { name } })
  }
}

// 同品类对比 API（模块六；单机模式对比本地历史记录）
export const compareAPI = {
  compare: async (ids) => {
    if (isLocalMode()) {
      try {
        const m = await import('@/local/compare')
        return ok(m.localCompare(ids))
      } catch (e) {
        return localErr(e)
      }
    }
    return api.post('/compare', { ids })
  }
}

// 健康食品推荐 API（个性化推荐模块；单机模式基于本机健康档案 + 内置食品库）
export const recommendAPI = {
  list: async (limit = 10) => {
    if (isLocalMode()) {
      const m = await import('@/local/recommend')
      return ok(m.localRecommend(limit))
    }
    return api.get('/recommend', { params: { limit } })
  }
}

// 营养摄入 API
export const nutritionAPI = {
  getMonthlyIntake: (yearMonth = null) => {
    const params = yearMonth ? { yearMonth } : {}
    return api.get('/nutrition/monthly', { params })
  },
  getDailyIntake: (date = null) => {
    const params = date ? { date } : {}
    return api.get('/nutrition/daily', { params })
  },
  addIntake: (data) => api.post('/nutrition/add', data),
  resetIntake: (type = 'daily') => api.post(`/nutrition/reset/${type}`)
}

// AI 提示 API（端点不存在时静默降级）
export const aiTipsAPI = {
  getDynamicSteps: () => api.get('/ai-tips/dynamic-steps', { silent: true }),
  getDynamicLevels: () => api.get('/ai-tips/dynamic-levels', { silent: true }),
  getDynamicChoices: () => api.get('/ai-tips/dynamic-choices', { silent: true }),
  getHealthTips: (type) => {
    const params = type ? { type } : {}
    return api.get('/ai-tips/health-tips', { params, silent: true })
  }
}

export default api
