/**
 * BYOK(用户自带 API Key)管理:
 *   - 复用 utils/api.js 既有的 llmConfig 存储(localStorage),保证两种模式配置互通
 *   - 剪贴板 Key 自动识别
 *   - 连通性测试(发一次最小化文本调用)
 */
import { getLlmConfig, saveLlmConfig, LLM_DEFAULTS } from '@/utils/api'
import { dashscopeTextCall } from './recognize'

/** 当前是否已配置 Key */
export function hasApiKey() {
  const cfg = getLlmConfig()
  return !!(cfg.apiKey && cfg.apiKey.trim())
}

/** 读取生效配置(含默认 model/endpoint 兜底) */
export function effectiveLlmConfig() {
  const cfg = getLlmConfig()
  return {
    apiKey: (cfg.apiKey || '').trim(),
    model: cfg.model || LLM_DEFAULTS.model,
    endpoint: cfg.endpoint || LLM_DEFAULTS.endpoint,
  }
}

/** 保存 Key(保留已有 model/endpoint 设置) */
export function saveApiKey(apiKey) {
  const cfg = getLlmConfig()
  saveLlmConfig({ ...cfg, apiKey: (apiKey || '').trim() })
}

/** 百炼 API Key 形态:sk- 开头的连续串 */
const KEY_PATTERN = /sk-[A-Za-z0-9]{16,64}/

/**
 * 尝试从剪贴板读出 API Key。
 * 浏览器需要用户手势触发 + 授权;失败(权限拒绝/不支持)返回 null,不抛错。
 */
export async function detectKeyFromClipboard() {
  try {
    if (!navigator.clipboard?.readText) return null
    const text = await navigator.clipboard.readText()
    const m = text && text.match(KEY_PATTERN)
    return m ? m[0] : null
  } catch {
    return null
  }
}

/** 百炼控制台「API-KEY 管理」页,引导页一键跳转用 */
export const KEY_CONSOLE_URL = 'https://bailian.console.aliyun.com/?apiKey=1'

/**
 * 连通性测试:发一次最小文本调用。
 * @returns {{ok: boolean, message: string}}
 */
export async function testConnection() {
  const cfg = effectiveLlmConfig()
  if (!cfg.apiKey) return { ok: false, message: '尚未填写 API Key' }
  try {
    const reply = await dashscopeTextCall('请只回复两个字:成功', cfg)
    if (reply) return { ok: true, message: '连接成功,Key 可用' }
    return { ok: false, message: '调用返回为空,请检查 Key 与模型权限' }
  } catch (e) {
    const msg = String(e?.message || e)
    if (msg.includes('401') || msg.includes('InvalidApiKey')) {
      return { ok: false, message: 'Key 无效或未开通百炼服务' }
    }
    if (msg.includes('Throttling') || msg.includes('429')) {
      return { ok: false, message: '触发限流,稍后再试(Key 本身有效)' }
    }
    return { ok: false, message: '连接失败:' + msg.slice(0, 120) }
  }
}
