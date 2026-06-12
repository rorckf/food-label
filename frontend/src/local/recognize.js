/**
 * BYOK 直连识别(本地版):App 用「用户自己的 Key」直接调阿里云 DashScope,不经过任何服务器。
 *
 * 提示词为 v2 版,相比后端 QwenService v1 增加了三道防御:
 *   1. isFoodLabel —— 非食品标签图片(自拍/表情包/猫片)直接判否,杜绝幻觉编造产品
 *   2. 营养基准换算 —— 标签按"每份/每100mL"标注时,模型必须换算为每100g(mL)口径,
 *      否则健康评分(按每100g对照NRV)会整体虚高
 *   3. 配料逐项照抄 —— 复合配料保留括号原文,由本地 additiveDb 负责拆解
 *
 * 跨域说明:DashScope 不下发 CORS 头。
 *   - App(Capacitor)环境:走 CapacitorHttp 原生请求,无跨域问题
 *   - 浏览器开发环境:走 Vite 代理 /dashscope-proxy(见 vite.config.js)
 */

export const RECOGNIZE_PROMPT_V2 = `你是一个食品标签识别助手。请分析图片,严格按照以下 JSON 格式返回,不要包含任何额外文字或代码块标记。
可能提供同一商品包装的多张照片(如正面、配料表、营养成分表),请综合全部照片提取信息;若多张照片信息冲突,以拍得更清晰的为准。

第一步:判断图片是否为食品包装/食品标签照片(多张时只要任意一张是即可)。
若都不是(如人物、风景、截图、动物等),只返回:{"isFoodLabel": false, "reason": "一句话说明图片内容"}

若是食品标签,返回:
{
  "isFoodLabel": true,
  "productName": "产品名称",
  "category": "食品品类,从以下挑一个最贴切的:饮料/乳制品/烘焙/糖果零食/方便食品/肉制品/调味品/酒类/茶叶/其他",
  "netContent": "净含量(如 250g)",
  "manufacturer": "生产商或委托商名称",
  "licenseNumber": "生产许可证编号(如 SC11331021511234)",
  "standard": "执行标准编号(如 GB/T 20977)",
  "origin": "产地(省+市,或具体地址)",
  "productionDate": "生产日期(原文照抄,如 2024-05-12 或 见包装)",
  "shelfLife": "保质期(原文照抄,如 12个月 或 至2025-05-12)",
  "storage": "贮存条件(如 常温避光保存)",
  "contact": "厂家联系方式(电话/网址,如有多项用空格分隔)",
  "nutritionBasis": "营养成分表的原始标注基准,原文照抄(如:每100g/每100mL/每份30g)",
  "nutrition": {
    "energy": 数值, "energyNRV": NRV%数值,
    "protein": 数值, "proteinNRV": NRV%数值,
    "fat": 数值, "fatNRV": NRV%数值,
    "carbohydrate": 数值, "carbohydrateNRV": NRV%数值,
    "sodium": 数值, "sodiumNRV": NRV%数值
  },
  "ingredients": ["配料1", "配料2"],
  "allergenText": "标签上 致敏物质/致敏原信息/过敏原 段落原文,包括交叉污染提示,无则为 null"
}

营养成分硬性规则(非常重要):
1. nutrition 中所有数值必须是「每100克(或每100毫升)」口径。
2. 若标签按"每份"标注(如 每份30g),你必须先换算:每100g数值 = 每份数值 ÷ 份量克数 × 100,再填入。
3. NRV% 直接照抄标签印刷值,仅填数字(12 表示 12%);若你做过换算导致与标签 NRV% 不对应,NRV% 填 null。
4. 能量单位 kJ,钠单位 mg,其余为 g。

配料表规则:
1. 按标签原文逐项抄录,保持原始顺序(含量降序)。
2. 复合配料保留括号及内部全文,如 "酱油(水,大豆,小麦,食用盐)" 抄成一项,不要自行拆开。
3. 含量百分比如有则保留,如 "草莓果酱(25%)"。

若某字段在标签中不存在或无法辨认,对应值设为 null。`

// ─── 传输层:Capacitor 原生 HTTP 或浏览器 fetch ───────────────

function isCapacitor() {
  return typeof window !== 'undefined' && !!window.Capacitor?.isNativePlatform?.()
}

/** 浏览器开发环境下,把 dashscope 域名换成 Vite 代理前缀 */
function resolveEndpoint(endpoint) {
  if (isCapacitor()) return endpoint
  return endpoint.replace('https://dashscope.aliyuncs.com', '/dashscope-proxy')
}

async function postJson(endpoint, apiKey, body) {
  const url = resolveEndpoint(endpoint)
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer ' + apiKey,
  }

  if (isCapacitor()) {
    const { CapacitorHttp } = window.Capacitor.Plugins
    const resp = await CapacitorHttp.post({ url, headers, data: body, readTimeout: 60000, connectTimeout: 15000 })
    if (resp.status >= 400) {
      throw new Error(`HTTP ${resp.status}: ${JSON.stringify(resp.data).slice(0, 200)}`)
    }
    return typeof resp.data === 'string' ? JSON.parse(resp.data) : resp.data
  }

  const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`HTTP ${resp.status}: ${text.slice(0, 200)}`)
  }
  return resp.json()
}

// ─── DashScope 响应解析(与后端 extractText 兼容 text/choices 两种结构) ───

function extractText(root) {
  const output = root?.output
  if (!output) return null
  if (output.text) return output.text
  const content = output.choices?.[0]?.message?.content
  if (Array.isArray(content)) return content[0]?.text ?? null
  if (typeof content === 'string') return content
  return null
}

function parseJsonBlock(text) {
  if (!text) return null
  const m = text.match(/\{[\s\S]+\}/)
  if (!m) return null
  try {
    return JSON.parse(m[0])
  } catch {
    return null
  }
}

// ─── 对外 API ────────────────────────────────────────────────

/**
 * 识别食品标签图片(支持同一包装多张照片综合识别)。
 * @param {string|string[]} base64Images  不带 data: 前缀的 base64 图片数据,单张或多张
 * @param {{apiKey, model, endpoint}} cfg  生效的 LLM 配置
 * @returns {object} 解析后的识别 JSON;非标签图片时 { isFoodLabel:false, reason }
 * @throws 网络/鉴权错误向上抛,由调用方提示
 */
export async function recognizeLabel(base64Images, cfg) {
  const images = Array.isArray(base64Images) ? base64Images : [base64Images]
  const body = {
    model: cfg.model,
    input: {
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: RECOGNIZE_PROMPT_V2 },
            ...images.map((b64) => ({ type: 'image', image: 'data:image/jpeg;base64,' + b64 })),
          ],
        },
      ],
    },
  }
  const root = await postJson(cfg.endpoint, cfg.apiKey, body)
  if (root?.code) {
    // DashScope 业务错误(如 InvalidApiKey / Throttling)
    throw new Error(`${root.code}: ${root.message || ''}`)
  }
  const parsed = parseJsonBlock(extractText(root))
  if (!parsed) throw new Error('模型返回内容无法解析,请重试')
  return parsed
}

/** 纯文本调用(配料翻译成人话 / 连通性测试共用) */
export async function dashscopeTextCall(prompt, cfg) {
  const body = {
    model: cfg.model,
    input: {
      messages: [
        { role: 'user', content: [{ type: 'text', text: prompt }] },
      ],
    },
  }
  const root = await postJson(cfg.endpoint, cfg.apiKey, body)
  if (root?.code) throw new Error(`${root.code}: ${root.message || ''}`)
  return extractText(root)
}

/** File/Blob → 不带前缀的 base64 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
