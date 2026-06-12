<template>
  <div class="prefs-page">
    <header class="prefs-hero">
      <h1 class="prefs-hero__title">个人偏好</h1>
      <p class="prefs-hero__sub">配置你自己的大模型 Key，识别额度自己掌控。</p>
    </header>

    <section class="parch-card">
      <header class="parch-card__head">
        <span class="parch-card__ornament">❖</span>
        <h3 class="parch-card__title">大模型 API 配置</h3>
      </header>
      <div class="parch-card__body">
        <p class="muted">
          配置你自己的大模型 API Key 后，图片识别将使用你的额度调用。
          配置仅保存在本机浏览器，不会上传服务器。留空则使用项目默认配置。
        </p>

        <div class="llm-form">
          <label class="llm-field">
            <span class="llm-field__label">API Key</span>
            <div class="llm-field__input-wrap">
              <input
                v-model.trim="llm.apiKey"
                :type="showKey ? 'text' : 'password'"
                class="llm-input"
                placeholder="sk-xxxxxxxxxxxxxxxx"
                autocomplete="off"
              />
              <button type="button" class="llm-eye" @click="showKey = !showKey">
                <component :is="showKey ? EyeOff : Eye" :size="15" />
              </button>
            </div>
          </label>

          <label class="llm-field">
            <span class="llm-field__label">模型名</span>
            <input
              v-model.trim="llm.model"
              type="text"
              class="llm-input"
              :placeholder="LLM_DEFAULTS.model"
              autocomplete="off"
            />
          </label>

          <label class="llm-field">
            <span class="llm-field__label">接口地址</span>
            <input
              v-model.trim="llm.endpoint"
              type="text"
              class="llm-input"
              :placeholder="LLM_DEFAULTS.endpoint"
              autocomplete="off"
            />
          </label>
        </div>

        <div class="actions">
          <button class="link-btn" @click="saveLlm">
            <Save :size="14" /> 保存配置
          </button>
          <button class="link-btn link-btn--mute" @click="resetLlm">
            恢复默认
          </button>
        </div>

        <div class="byok-help">
          <p class="muted byok-help__hint">
            还没有 Key？阿里云百炼新用户每个模型送 100 万 Tokens 免费额度（约可扫描 300 次）。
          </p>
          <div class="actions">
            <button class="link-btn" @click="openKeyConsole">
              <ExternalLink :size="14" /> ① 去百炼创建 Key
            </button>
            <button class="link-btn" @click="pasteKeyFromClipboard">
              <ClipboardPaste :size="14" /> ② 从剪贴板填入
            </button>
            <button class="link-btn" :disabled="testing" @click="testKey">
              <component :is="testing ? Loader : PlugZap" :size="14" :class="{ 'spin': testing }" />
              ③ 测试连接
            </button>
          </div>
          <p v-if="testResult" class="byok-test" :class="testResult.ok ? 'byok-test--ok' : 'byok-test--bad'">
            {{ testResult.ok ? '✅' : '❌' }} {{ testResult.message }}
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Eye, EyeOff, Save, ExternalLink, ClipboardPaste, PlugZap, Loader } from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { getLlmConfig, saveLlmConfig, clearLlmConfig, LLM_DEFAULTS } from '@/utils/api'
import { detectKeyFromClipboard, testConnection, KEY_CONSOLE_URL } from '@/local/byok'

// ───── 大模型 API 配置 ─────
const llm = ref({ apiKey: '', model: '', endpoint: '' })
const showKey = ref(false)

const loadLlm = () => {
  const cfg = getLlmConfig()
  llm.value = {
    apiKey: cfg.apiKey || '',
    model: cfg.model || '',
    endpoint: cfg.endpoint || ''
  }
}

const saveLlm = () => {
  saveLlmConfig({
    apiKey: llm.value.apiKey || '',
    model: llm.value.model || '',
    endpoint: llm.value.endpoint || ''
  })
  ElMessage.success('大模型配置已保存')
}

const resetLlm = () => {
  clearLlmConfig()
  llm.value = { apiKey: '', model: '', endpoint: '' }
  testResult.value = null
  ElMessage.success('已恢复默认配置')
}

// ───── BYOK 引导:跳转控制台 / 剪贴板填入 / 测试连接 ─────
const testing = ref(false)
const testResult = ref(null)

const openKeyConsole = () => {
  window.open(KEY_CONSOLE_URL, '_blank')
  ElMessage.info('在打开的页面创建 API Key 并复制，然后回来点「从剪贴板填入」')
}

const pasteKeyFromClipboard = async () => {
  const key = await detectKeyFromClipboard()
  if (!key) {
    ElMessage.warning('剪贴板里没有发现 sk- 开头的 Key，请先在百炼控制台复制')
    return
  }
  llm.value.apiKey = key
  saveLlmConfig({ ...getLlmConfig(), apiKey: key })
  testResult.value = null
  ElMessage.success('Key 已填入并保存，点「测试连接」验证一下吧')
}

const testKey = async () => {
  // 先把当前表单内容保存,确保测试的是用户看到的配置
  saveLlmConfig({
    apiKey: llm.value.apiKey || '',
    model: llm.value.model || '',
    endpoint: llm.value.endpoint || ''
  })
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await testConnection()
  } finally {
    testing.value = false
  }
}

onMounted(loadLlm)
</script>

<style scoped>
/* ── BYOK 引导区 ── */
.byok-help {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--w-border-soft);
}
.byok-help__hint { margin-bottom: 8px; }
.byok-test {
  margin: 8px 0 0;
  font-size: 13px;
  letter-spacing: 0.03em;
}
.byok-test--ok { color: #16A34A; }
.byok-test--bad { color: #DC2626; }
.spin { animation: byok-spin 1s linear infinite; }
@keyframes byok-spin { to { transform: rotate(360deg); } }
</style>

<style scoped>
.prefs-page {
  max-width: var(--w-content-max);
  margin: 0 auto;
  padding: var(--w-space-5) var(--w-space-6) var(--w-space-7);
}
.prefs-hero { text-align: center; padding: var(--w-space-3) 0 var(--w-space-5); }
.prefs-hero__title {
  font-family: var(--w-font-serif);
  font-size: var(--w-fs-h1);
  font-weight: 500;
  color: var(--w-ink);
  letter-spacing: 0.06em;
  margin: 0 0 8px;
}
.prefs-hero__sub {
  color: var(--w-ink-mid);
  font-size: 13.5px;
  letter-spacing: 0.04em;
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
.parch-card__ornament { color: var(--w-amber); font-size: 14px; }
.parch-card__title {
  font-family: var(--w-font-serif);
  font-size: 17px; font-weight: 500;
  color: var(--w-ink); letter-spacing: 0.1em; margin: 0;
}
.parch-card__body { position: relative; z-index: 1; }

.muted { color: var(--w-ink-mute); font-size: 13px; margin: 0 0 var(--w-space-3); }

.actions { display: flex; gap: var(--w-space-4); align-items: center; }
.link-btn {
  display: inline-flex; align-items: center; gap: 6px;
  color: var(--w-primary); font-size: 13px;
  letter-spacing: 0.06em; padding: 6px 0;
  background: transparent; border: 0; cursor: pointer;
  transition: color 0.2s var(--w-ease);
}
.link-btn:hover { color: var(--w-primary-hover); }
.link-btn--mute { color: var(--w-ink-mute); }
.link-btn--mute:hover { color: var(--w-terracotta, #c15637); }

/* ── 大模型配置表单 ── */
.parch-card + .parch-card { margin-top: var(--w-space-5); }
.llm-form {
  display: flex; flex-direction: column;
  gap: var(--w-space-3);
  margin: var(--w-space-3) 0;
}
.llm-field { display: flex; flex-direction: column; gap: 6px; }
.llm-field__label {
  font-size: 12.5px; color: var(--w-ink-mid);
  letter-spacing: 0.05em;
}
.llm-field__input-wrap { position: relative; display: flex; align-items: center; }
.llm-input {
  width: 100%; box-sizing: border-box;
  padding: 9px 12px;
  font-size: 13px; color: var(--w-ink);
  background: var(--w-surface);
  border: 1px solid var(--w-border-soft);
  border-radius: var(--w-radius-md, 8px);
  outline: none;
  transition: border-color 0.2s var(--w-ease);
}
.llm-input::placeholder { color: var(--w-ink-mute); }
.llm-input:focus { border-color: var(--w-primary); }
.llm-field__input-wrap .llm-input { padding-right: 38px; }
.llm-eye {
  position: absolute; right: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px;
  color: var(--w-ink-mute); background: transparent;
  border: 0; cursor: pointer; border-radius: 6px;
  transition: color 0.2s var(--w-ease);
}
.llm-eye:hover { color: var(--w-primary); }
</style>
