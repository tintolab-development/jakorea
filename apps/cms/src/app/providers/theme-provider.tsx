/**
 * Ant Design Theme Provider
 * 색상 variation을 다양하게 설정
 */

import { ConfigProvider, theme } from 'antd'
import type { ReactNode } from 'react'
import './theme-provider.css'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ConfigProvider
      theme={{
        token: {
          // Primary 색상 - 메인 브랜드 컬러 (#01A1AF)
          colorPrimary: '#01a1af',
          colorSuccess: '#52c41a', // 매칭 색상 활용
          colorWarning: '#fadb14', // 일정 색상 활용
          colorError: '#ff4d4f', // 정산 색상 활용
          colorInfo: '#01a1af', // 메인 컬러

          // Border radius
          borderRadius: 6,
          borderRadiusLG: 8,
          borderRadiusSM: 4,

          // Font
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          fontSize: 14,
          fontSizeLG: 16,
          fontSizeSM: 12,
        },
        components: {
          Button: {
            borderRadius: 6,
          },
          Card: {
            borderRadius: 8,
          },
          Table: {
            borderRadius: 8,
          },
          Input: {
            borderRadius: 6,
          },
          Select: {
            borderRadius: 6,
          },
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  )
}

