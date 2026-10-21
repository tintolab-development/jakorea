/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { e2eErrorLogMockApiPlugin } from './vite-plugins/e2e-error-log-mock-api'
import { e2eTestLogMockApiPlugin } from './vite-plugins/e2e-test-log-mock-api'
import { platformPreviewBundlePlugin } from './vite-plugins/platform-preview-bundle'
import type { ProxyOptions } from 'vite'

const IDENTITY_VERIFICATION_API_PREFIX = '/api/auth/verification-sessions'

function normalizeProxyTarget(url: string): string {
  return url.replace(/\/$/, '')
}

function configureNgrokProxyHeaders(
  proxy: { on: (event: 'proxyReq', handler: (proxyReq: { setHeader: (name: string, value: string) => void }) => void) => void },
  targetUrl: string,
  ngrokSkipEnv: string | undefined
) {
  proxy.on('proxyReq', proxyReq => {
    const skip = ngrokSkipEnv?.trim()
    const isNgrokTarget = /ngrok/i.test(targetUrl)
    if (skip || isNgrokTarget) {
      proxyReq.setHeader('ngrok-skip-browser-warning', skip || '69420')
    }
  })
}

function createDevApiProxy(
  targetUrl: string,
  env: Record<string, string>,
  options?: { ws?: boolean }
): ProxyOptions {
  return {
    target: normalizeProxyTarget(targetUrl),
    changeOrigin: true,
    secure: false,
    ws: options?.ws ?? false,
    configure(proxy) {
      configureNgrokProxyHeaders(proxy, targetUrl, env.VITE_NGROK_SKIP_BROWSER_WARNING)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  /** 로컬에서 `/api` → 백엔드(배포 서버·ngrok 등). 기존 팀 관례: `VITE_API_SERVER` */
  const proxyTarget =
    env.VITE_API_SERVER?.trim() ||
    env.VITE_DEV_PROXY_TARGET?.trim() ||
    env.VITE_NGROK_SERVER?.trim()

  const identityVerificationProxyCandidate =
    env.VITE_IDENTITY_VERIFICATION_API_SERVER?.trim() || env.VITE_NGROK_SERVER?.trim()
  const identityVerificationProxyTarget =
    proxyTarget &&
    identityVerificationProxyCandidate &&
    normalizeProxyTarget(identityVerificationProxyCandidate) !== normalizeProxyTarget(proxyTarget)
      ? identityVerificationProxyCandidate
      : undefined

  const devProxy: Record<string, ProxyOptions> | undefined = proxyTarget
    ? {
        ...(identityVerificationProxyTarget
          ? {
              [IDENTITY_VERIFICATION_API_PREFIX]: createDevApiProxy(
                identityVerificationProxyTarget,
                env
              ),
            }
          : {}),
        '/api': createDevApiProxy(proxyTarget, env, { ws: true }),
      }
    : undefined

  return {
    plugins: [
      react(),
      e2eErrorLogMockApiPlugin(),
      e2eTestLogMockApiPlugin(),
      platformPreviewBundlePlugin({
        bundleDir: path.resolve(__dirname, '../platform/dist-preview'),
      }),
    ],
    optimizeDeps: {
      include: ['@fortune-sheet/react', '@fortune-sheet/core', 'lodash', 'immer', 'pdfjs-dist'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        /** CSS는 package exports가 dist만 가리킴 — CMS dev에서 src 수정이 바로 반영되도록 */
        '@jakorea/form-template-runtime/detail-info-form.css': path.resolve(
          __dirname,
          '../../packages/form-template-runtime/src/detail-info-form/detail-info-form.css'
        ),
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
      proxy: devProxy,
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
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.mjs'],
      passWithNoTests: true,
      setupFiles: ['src/test/vitest-setup.ts'],
    },
  }
})
