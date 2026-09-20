import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { ProxyOptions } from 'vite'
import postcssCustomMedia from 'postcss-custom-media'
import postcssGlobalData from '@csstools/postcss-global-data'
import { mockProgramCatalogApiPlugin } from '../../tools/mock-program-catalog/vite-plugin'

function withNgrokSkip(
  target: string,
  skipHeader: string | undefined,
): ProxyOptions {
  const normalized = target.replace(/\/$/, '')
  const isNgrokTarget = /ngrok/i.test(normalized)
  return {
    target: normalized,
    changeOrigin: true,
    secure: false,
    ws: true,
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
  /** CMS/Portal — 로그인·회원가입·세션 (`/api/portal`) */
  const cmsTarget =
    env.VITE_API_SERVER?.trim() ||
    env.VITE_DEV_PROXY_TARGET?.trim() ||
    env.VITE_NGROK_SERVER?.trim()
  /** Homepage Admin (JAHOMEADMINBACK) — `/api/public/main` 등. 미설정 시 8081 */
  const homepageTarget =
    env.VITE_HOMEPAGE_API_SERVER?.trim() || 'http://localhost:8081'
  const ngrokSkip = env.VITE_NGROK_SKIP_BROWSER_WARNING?.trim()

  const proxy: Record<string, ProxyOptions> | undefined = (() => {
    if (!cmsTarget && !homepageTarget) return undefined
    const entries: Record<string, ProxyOptions> = {}
    if (cmsTarget) {
      entries['/api/portal'] = withNgrokSkip(cmsTarget, ngrokSkip)
    }
    if (homepageTarget) {
      entries['/api'] = withNgrokSkip(homepageTarget, ngrokSkip)
    }
    return entries
  })()

  return {
    plugins: [
      react(),
      mockProgramCatalogApiPlugin({ monorepoRoot: path.resolve(__dirname, '../..') }),
    ],
    css: {
      postcss: {
        plugins: [
          postcssGlobalData({
            files: [path.resolve(__dirname, 'src/shared/styles/breakpoints.css')],
          }),
          postcssCustomMedia(),
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      // workspace 패키지 단일 인스턴스 (에디터·툴바 동일 번들)
      dedupe: ['@tiptap/core', '@tiptap/pm', '@tiptap/react', 'react', 'react-dom', 'antd'],
    },
    optimizeDeps: {
      include: [
        '@tiptap/core',
        '@tiptap/react',
        '@tiptap/starter-kit',
        '@tiptap/extension-emoji',
        '@tiptap/extension-superscript',
        '@tiptap/extension-file-handler',
        '@tiptap/extension-dropcursor',
        '@tiptap/markdown',
      ],
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy,
    },
  }
})
