/**
 * 运行模式开关:
 *   server —— 传统模式,所有请求走 Spring Boot 后端(网页版/毕设原版)
 *   local  —— 单机模式,识别直连阿里云(BYOK),数据与算法全在本地(App 版)
 *
 * 判定优先级:
 *   1. localStorage.appMode 显式设置(Preferences 页可切换,便于调试)
 *   2. Capacitor 原生环境 → 默认 local
 *   3. 其余(浏览器) → 默认 server
 */

export function isLocalMode() {
  try {
    const explicit = localStorage.getItem('appMode')
    if (explicit === 'local') return true
    if (explicit === 'server') return false
  } catch { /* ignore */ }
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()
}

export function setAppMode(mode) {
  if (mode === 'local' || mode === 'server') localStorage.setItem('appMode', mode)
  else localStorage.removeItem('appMode')
}
