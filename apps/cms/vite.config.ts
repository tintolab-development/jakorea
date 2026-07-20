/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { e2eErrorLogMockApiPlugin } from './vite-plugins/e2e-error-log-mock-api'
import { e2eTestLogMockApiPlugin } from './vite-plugins/e2e-test-log-mock-api'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  /** 로컬에서 `/api` → 백엔드(배포 서버·ngrok 등). 기존 팀 관례: `VITE_API_SERVER` */
  const proxyTarget =
    env.VITE_API_SERVER?.trim() ||
    env.VITE_DEV_PROXY_TARGET?.trim() ||
    env.VITE_NGROK_SERVER?.trim()

  return {
    plugins: [react(), e2eErrorLogMockApiPlugin(), e2eTestLogMockApiPlugin()],
    optimizeDeps: {
      include: ['@fortune-sheet/react', '@fortune-sheet/core', 'lodash', 'immer'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@jakorea/social-auth': path.resolve(__dirname, '../../packages/social-auth/src/index.ts'),
        '@jakorea/rich-text/react': path.resolve(
          __dirname,
          '../../packages/rich-text/src/react/index.ts'
        ),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
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
                  /** ngrok 무료 호스트 — 안내 페이지·403 방지 (Postman 과 유사하게 최소 헤더: Origin 은 브라우저 기본값 유지) */
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
            // node_modules의 큰 라이브러리들을 별도 청크로 분리
            if (id.includes('node_modules')) {
              // React & React DOM을 가장 먼저 분리 (Ant Design이 의존)
              // scheduler도 React의 일부이므로 포함
              if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
                return 'react-vendor'
              }
              // Ant Design (React 이후에 로드되어야 함)
              if (id.includes('antd') || id.includes('@ant-design')) {
                return 'antd'
              }
              // React Router
              if (id.includes('react-router')) {
                return 'react-router'
              }
              // React Hook Form
              if (id.includes('react-hook-form')) {
                return 'react-hook-form'
              }
              // TanStack Table
              if (id.includes('@tanstack/react-table')) {
                return 'tanstack-table'
              }
              // Zustand
              if (id.includes('zustand')) {
                return 'zustand'
              }
              // Zod
              if (id.includes('zod')) {
                return 'zod'
              }
              // Day.js
              if (id.includes('dayjs')) {
                return 'dayjs'
              }
              // ExcelJS
              if (id.includes('exceljs')) {
                return 'exceljs'
              }
              // Axios
              if (id.includes('axios')) {
                return 'axios'
              }
              // File Saver
              if (id.includes('file-saver')) {
                return 'file-saver'
              }
              // Date-fns
              if (id.includes('date-fns')) {
                return 'date-fns'
              }
              // 기타 node_modules
              return 'vendor'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000, // 청크 크기 경고 임계값을 1MB로 상향
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
      passWithNoTests: true,
    },
  }
})
