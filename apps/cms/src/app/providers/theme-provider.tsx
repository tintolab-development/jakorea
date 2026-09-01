/**
 * Ant Design Theme Provider
 * Hex 시맨틱 값은 `@/shared/constants/colors` 의 brandColorsHex / domainColorsHex 와 동기화.
 * CSS 토큰 SSOT는 `./theme-provider.css` (:root). Platform·packages/ui와 무관.
 */

import { ConfigProvider, theme } from 'antd'
import type { ReactNode } from 'react'
import { brandColorsHex, domainColorsHex } from '@/shared/constants/colors'
import './theme-provider.css'
import './ant-modal-motion-disable.css'

/** `theme-provider.css` `--color-table-row-hover` / selected overlay 와 동일값 유지 */
const TABLE_ROW_BRAND_OVERLAY = 'rgba(1, 161, 175, 0.06)'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <ConfigProvider
      /* 클릭 wave 잔여 DOM/페인트가 뷰포트 하단에 민트 띠로 남는 경우 방지 */
      wave={{ disabled: true }}
      theme={{
        token: {
          colorPrimary: brandColorsHex.primary,
          colorSuccess: domainColorsHex.matching.primary,
          colorWarning: domainColorsHex.schedule.primary,
          colorError: domainColorsHex.settlement.primary,
          colorInfo: brandColorsHex.primary,

          // Border radius — `:root` --radius-6 / --radius-8 / --radius-4 와 동일
          borderRadius: 6,
          borderRadiusLG: 8,
          borderRadiusSM: 4,

          // Font
          fontFamily: 'Pretendard, system-ui, sans-serif',
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
            rowHoverBg: TABLE_ROW_BRAND_OVERLAY,
            rowSelectedBg: TABLE_ROW_BRAND_OVERLAY,
            /* 선택 행 호버 시 배경이 진해지지 않도록(기본 rowSelectedHoverBg와 분리됨) */
            rowSelectedHoverBg: TABLE_ROW_BRAND_OVERLAY,
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
