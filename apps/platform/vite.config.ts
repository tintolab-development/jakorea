import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import postcssCustomMedia from 'postcss-custom-media'
import postcssGlobalData from '@csstools/postcss-global-data'

// https://vite.dev/config/
export default defineConfig({
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
})
