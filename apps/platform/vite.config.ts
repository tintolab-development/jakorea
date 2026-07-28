import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import postcssCustomMedia from 'postcss-custom-media'
import postcssGlobalData from '@csstools/postcss-global-data'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  /** 로컬에서 `/api` → 백엔드(배포 서버·ngrok 등). CMS와 동일: `VITE_API_SERVER` */
  const proxyTarget =
    env.VITE_API_SERVER?.trim() ||
    env.VITE_DEV_PROXY_TARGET?.trim() ||
    env.VITE_NGROK_SERVER?.trim()

  return {
    plugins: [react()],
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
  }
})
