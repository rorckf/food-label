import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3030,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      // BYOK 本地模式:浏览器开发环境下代理 DashScope(其不下发 CORS 头)
      // App(Capacitor)环境走原生 HTTP,不经过此代理
      '/dashscope-proxy': {
        target: 'https://dashscope.aliyuncs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dashscope-proxy/, '')
      }
    }
  }
})