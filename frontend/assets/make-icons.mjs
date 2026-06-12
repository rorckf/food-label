// 生成 App 图标源图:node assets/make-icons.mjs(在 frontend 目录下运行)
// 产物供 @capacitor/assets 使用:icon-only / icon-foreground / icon-background / splash
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const OUT = path.dirname(fileURLToPath(import.meta.url))

// ── 设计参数 ──
const GRAD = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#34D399"/>
    <stop offset="0.55" stop-color="#10B981"/>
    <stop offset="1" stop-color="#047857"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.28" cy="0.22" r="0.9">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.22"/>
    <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>`

const GRAD_DARK = `
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#065F46"/>
    <stop offset="1" stop-color="#022C22"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.28" cy="0.22" r="0.9">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.08"/>
    <stop offset="0.5" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>`

// 取景框 + 扫描线 + 叶子(以 0,0 为中心,设计尺寸约 ±330)
const glyph = (scale) => `
  <g transform="scale(${scale})" fill="none" stroke="#FFFFFF"
     stroke-width="54" stroke-linecap="round">
    <path d="M -280 -150 L -280 -230 Q -280 -280 -230 -280 L -150 -280"/>
    <path d="M  150 -280 L  230 -280 Q  280 -280  280 -230 L  280 -150"/>
    <path d="M  280  150 L  280  230 Q  280  280  230  280 L  150  280"/>
    <path d="M -150  280 L -230  280 Q -280  280 -280  230 L -280  150"/>
  </g>
  <rect transform="scale(${scale})" x="-330" y="-21" width="660" height="42" rx="21"
        fill="#FFFFFF" opacity="0.42"/>
  <g transform="scale(${scale}) rotate(-32)">
    <path d="M 0 -180 Q 165 0 0 180 Q -165 0 0 -180 Z" fill="#FFFFFF"/>
    <path d="M 0 160 Q 8 205 38 230" fill="none" stroke="#FFFFFF"
          stroke-width="30" stroke-linecap="round"/>
  </g>`

const svg = {
  // 完整图标(旧式方形启动图标)
  'icon-only': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <defs>${GRAD}</defs>
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <rect width="1024" height="1024" fill="url(#glow)"/>
    <g transform="translate(512 512)">${glyph(1)}</g>
  </svg>`,
  // 自适应图标前景(图形收进中央 66% 安全区)
  'icon-foreground': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <g transform="translate(512 512)">${glyph(0.78)}</g>
  </svg>`,
  // 自适应图标背景
  'icon-background': `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024">
    <defs>${GRAD}</defs>
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <rect width="1024" height="1024" fill="url(#glow)"/>
  </svg>`,
  // 启动页
  'splash': `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732">
    <defs>${GRAD}</defs>
    <rect width="2732" height="2732" fill="url(#bg)"/>
    <rect width="2732" height="2732" fill="url(#glow)"/>
    <g transform="translate(1366 1366)">${glyph(1.05)}</g>
  </svg>`,
  'splash-dark': `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732">
    <defs>${GRAD_DARK}</defs>
    <rect width="2732" height="2732" fill="url(#bg)"/>
    <rect width="2732" height="2732" fill="url(#glow)"/>
    <g transform="translate(1366 1366)">${glyph(1.05)}</g>
  </svg>`,
}

for (const [name, body] of Object.entries(svg)) {
  const file = path.join(OUT, `${name}.png`)
  await sharp(Buffer.from(body)).png().toFile(file)
  console.log('wrote', file)
}
