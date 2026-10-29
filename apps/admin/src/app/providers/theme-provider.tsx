/**
 * Ant Design Theme Provider (Homepage Admin)
 * 공통 admin theme: `@jakorea/admin-ui`. 앱 domain overlay는 CMS와 동일 hex.
 * CSS 공통 토큰: `@jakorea/admin-ui/styles`. 앱 종속: `./theme-provider.css`.
 */

import { adminConfigProviderWave, mergeAdminTheme } from '@jakorea/admin-ui'
import '@jakorea/admin-ui/styles'
import { ConfigProvider } from 'antd'
import type { ReactNode } from 'react'
import { domainColorsHex } from '@/shared/constants/colors'
import './theme-provider.css'
import './ant-modal-motion-disable.css'

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
          colorError: domainColorsHex.settlement.primary,
        },
      })}
    >
      {children}
    </ConfigProvider>
  )
}
