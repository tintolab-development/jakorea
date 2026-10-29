/**
 * Ant Design Theme Provider
 * Hex 시맨틱 값은 `@/shared/constants/colors` 의 brandColorsHex / domainColorsHex 와 동기화.
 * 공통 admin theme: `@jakorea/admin-ui`. CSS 공통 토큰: `@jakorea/admin-ui/styles`.
 * 앱 종속 CSS: `./theme-provider.css`. Platform·packages/ui와 무관.
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
