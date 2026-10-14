import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { Plugin, ProxyOptions } from 'vite'
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

const PLATFORM_PREVIEW_MODE = 'platform-preview'
const PLATFORM_PREVIEW_DISABLED_ENV_KEYS = [
  'VITE_API_BASE_URL',
  'VITE_API_SERVER',
  'VITE_DEV_PROXY_TARGET',
  'VITE_NGROK_SERVER',
  'VITE_HOMEPAGE_API_SERVER',
] as const

/** tree-shake로 빠진 모듈의 asset도 Vite는 방출하므로, 번들에서 참조되지 않는 파일을 지운다. */
function dropUnreferencedAssetsPlugin(): Plugin {
  return {
    name: 'platform-preview-drop-unreferenced-assets',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const texts = Object.values(bundle).map(item =>
        item.type === 'chunk'
          ? item.code
          : typeof item.source === 'string'
            ? item.source
            : '',
      )
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item.type !== 'asset' || fileName.endsWith('.html')) continue
        const baseName = path.basename(fileName)
        if (!texts.some(text => text.includes(baseName))) delete bundle[fileName]
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  /** CMS/Portal — `/api/portal` 로그인·회원가입, `/api/auth` NICE 본인인증 */
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
      entries['/api/portal'] = {
        ...withNgrokSkip(cmsTarget, ngrokSkip),
        // 안내사항 본문 이미지 302 Location(백엔드 절대 주소)을 dev origin 으로 — XHR 이 교차 출처로 넘어가지 않게
        autoRewrite: true,
      }
      // CMS shared auth (NICE start is public). Must beat the catch-all `/api` → 8081.
      entries['/api/auth'] = withNgrokSkip(cmsTarget, ngrokSkip)
      // 약관 원장 current — JABACK. `/api/public/*` 기본은 Homepage이므로 더 긴 prefix로 분리.
      entries['/api/public/terms-documents'] = withNgrokSkip(cmsTarget, ngrokSkip)
    }
    if (homepageTarget) {
      entries['/api'] = withNgrokSkip(homepageTarget, ngrokSkip)
    }
    return entries
  })()

  /** CMS 모집 미리보기 번들 — CMS `dist/platform-preview/`에 복사되어 같은 도메인 iframe으로 뜬다. */
  const isProgramPreviewBuild = mode === PLATFORM_PREVIEW_MODE

  return {
    ...(isProgramPreviewBuild
      ? {
          base: '/platform-preview/',
          // 미리보기는 CMS가 보낸 데이터만 쓴다 — 원격 API 비활성(헤더·푸터 fallback)
          define: Object.fromEntries(
            PLATFORM_PREVIEW_DISABLED_ENV_KEYS.map(key => [`import.meta.env.${key}`, '""']),
          ),
          build: {
            outDir: 'dist-preview',
            emptyOutDir: true,
            rollupOptions: {
              input: path.resolve(__dirname, 'preview.html'),
              // barrel(`@/shared/ui`, `@/features/*`)로 딸려오는 미사용 모듈·이미지 제거
              treeshake: {
                moduleSideEffects: (id: string) =>
                  id.includes('node_modules') || /\.(css|scss)(\?|$)/.test(id),
              },
            },
          },
        }
      : {}),
    plugins: [
      react(),
      mockProgramCatalogApiPlugin({ monorepoRoot: path.resolve(__dirname, '../..') }),
      ...(isProgramPreviewBuild ? [dropUnreferencedAssetsPlugin()] : []),
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
