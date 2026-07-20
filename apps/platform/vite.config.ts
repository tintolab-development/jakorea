import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
