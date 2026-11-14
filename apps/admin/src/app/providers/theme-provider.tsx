/**
 * Ant Design Theme Provider (Homepage Admin)
 * 공통 admin theme: `@jakorea/admin-ui`. 앱 domain overlay는 CMS와 동일 hex.
 * CSS 공통 토큰: `@jakorea/admin-ui/styles`. 앱 종속: `./theme-provider.css`.
 */

import {
  adminConfigProviderWave,
  installScrollbarModeClass,
  mergeAdminTheme,
} from '@jakorea/admin-ui'
import '@jakorea/admin-ui/styles'
import { ConfigProvider } from 'antd'
import type { ReactNode } from 'react'
import { domainColorsHex } from '@/shared/constants/colors'
import './theme-provider.css'
import './ant-modal-motion-disable.css'

// 고정형 스크롤바 환경(Windows 등)에만 <html>.scrollbar-classic — 전역 4px 시안 스크롤바(admin-ui styles/scrollbar.css)
installScrollbarModeClass()

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ConfigProvider
      wave={adminConfigProviderWave}
      theme={mergeAdminTheme({
        token: {
          colorSuccess: domainColorsHex.matching.primary,
          colorWarning: domainColorsHex.schedule.primary,
          // 오류·필수 표시(*)는 디자인 토큰 Status/red/main(#C32F4A) — 정산 도메인색(#FF4D4F)을 쓰지 않는다
          colorError: '#c32f4a',
        },
        components: {
          /**
           * 토글(Switch) — Figma 홈페이지 어드민 DS `Toggle` (node 94:7208)
           * 트랙 42×24 · 패딩 4 · 썸 16 · 켜짐 brand primary / 꺼짐 #BDC6C9
           * 꺼짐 썸 그림자 없음: `./theme-provider.css`
           */
          Switch: {
            trackHeight: 24,
            trackMinWidth: 42,
            trackPadding: 4,
            handleSize: 16,
            innerMinMargin: 8,
            innerMaxMargin: 28,
            handleShadow: '0 3px 7px 0 rgba(0, 0, 0, 0.12)',
            colorTextQuaternary: '#bdc6c9',
          },
        },
      })}
    >
      {children}
    </ConfigProvider>
  )
}
