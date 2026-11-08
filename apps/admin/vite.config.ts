import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { ProxyOptions } from 'vite'
import { viteAppBuildDefine } from '../../scripts/vite-app-build-define'
import {
  FORM_TEMPLATE_RUNTIME_OPTIMIZE_DEPS_EXCLUDE,
  formTemplateRuntimeWatchIgnored,
} from '../../scripts/vite-form-template-runtime-watch'

function withNgrokSkip(target: string, skipHeader: string | undefined): ProxyOptions {
  const normalized = target.replace(/\/$/, '')
  const isNgrokTarget = /ngrok/i.test(normalized)
  return {
    target: normalized,
    changeOrigin: true,
    secure: false,
    ws: true,
    // 로그 IP: 백엔드가 프록시(127.0.0.1) 대신 원래 접속 IP를 알 수 있게 X-Forwarded-* 를 붙인다.
    xfwd: true,
    configure(proxy) {
      proxy.on('proxyReq', proxyReq => {
        if (skipHeader || isNgrokTarget) {
          proxyReq.setHeader('ngrok-skip-browser-warning', skipHeader || '69420')
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  /** CMS 백엔드 — 로그인·MFA·refresh (`/api/admin/auth`) */
  const cmsTarget =
    env.VITE_API_SERVER?.trim() ||
    env.VITE_DEV_PROXY_TARGET?.trim() ||
    env.VITE_NGROK_SERVER?.trim()
  /** Homepage Admin API — 도메인 CRUD (`/api/admin/main` 등) */
  const homepageTarget = env.VITE_HOMEPAGE_API_SERVER?.trim() || 'http://localhost:8081'
  const ngrokSkip = env.VITE_NGROK_SKIP_BROWSER_WARNING?.trim()

  const proxy: Record<string, ProxyOptions> | undefined = (() => {
    if (!cmsTarget && !homepageTarget) return undefined
    const entries: Record<string, ProxyOptions> = {}
    if (cmsTarget) {
      entries['/api/admin/auth'] = withNgrokSkip(cmsTarget, ngrokSkip)
      entries['/api/admin/me'] = withNgrokSkip(cmsTarget, ngrokSkip)
      entries['/api/auth/verification-sessions'] = withNgrokSkip(cmsTarget, ngrokSkip)
      entries['/api/public/terms-documents'] = withNgrokSkip(cmsTarget, ngrokSkip)
    }
    if (homepageTarget) {
      entries['/api'] = withNgrokSkip(homepageTarget, ngrokSkip)
    }
    return entries
  })()

  return {
    define: viteAppBuildDefine(),
    plugins: [react()],
    optimizeDeps: {
      exclude: [...FORM_TEMPLATE_RUNTIME_OPTIMIZE_DEPS_EXCLUDE],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      /** CMS(3000)와 충돌 방지 */
      port: 3001,
      proxy,
      watch: {
        ignored: formTemplateRuntimeWatchIgnored,
      },
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
