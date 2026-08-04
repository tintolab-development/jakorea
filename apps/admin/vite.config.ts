import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  /** 로컬에서 `/api` → 백엔드. CMS와 동일 관례: `VITE_API_SERVER` */
  const proxyTarget =
    env.VITE_API_SERVER?.trim() ||
    env.VITE_DEV_PROXY_TARGET?.trim() ||
    env.VITE_NGROK_SERVER?.trim()

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      /** CMS(3000)와 충돌 방지 */
      port: 3001,
      proxy: proxyTarget
        ? {
            '/api': {
              target: proxyTarget.replace(/\/$/, ''),
              changeOrigin: true,
              secure: false,
              ws: true,
              configure(proxy) {
                proxy.on('proxyReq', proxyReq => {
                  const skip = env.VITE_NGROK_SKIP_BROWSER_WARNING?.trim()
                  const isNgrokTarget = /ngrok/i.test(proxyTarget)
                  if (skip || isNgrokTarget) {
                    proxyReq.setHeader('ngrok-skip-browser-warning', skip || '69420')
                  }
                })
              },
            },
          }
        : undefined,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: id => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'react-vendor'
              }
              if (id.includes('antd') || id.includes('@ant-design')) {
                return 'antd'
              }
              if (id.includes('react-router')) {
                return 'react-router'
              }
            }
          },
        },
      },
    },
  }
})
