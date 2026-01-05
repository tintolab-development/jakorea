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
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // node_modules의 큰 라이브러리들을 별도 청크로 분리
          if (id.includes('node_modules')) {
            // Ant Design
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'antd'
            }
            // React & React DOM
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
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
})
