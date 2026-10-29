import { theme, type ThemeConfig } from 'antd'

/** CMS/Admin ThemeProvider와 동일 hex — `:root` --color-brand-primary */
export const ADMIN_BRAND_PRIMARY = '#01a1af'

/** CMS/Admin `--color-table-row-hover` / selected overlay와 동일 */
export const ADMIN_TABLE_ROW_BRAND_OVERLAY = 'rgba(1, 161, 175, 0.06)'

export const ADMIN_THEME_RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
} as const

export const ADMIN_THEME_FONT = {
  fontFamily: 'Pretendard, system-ui, sans-serif',
  fontSize: 14,
  fontSizeLG: 16,
  fontSizeSM: 12,
} as const

/** Ant Design wave — 두 어드민 ThemeProvider와 동일 */
export const adminConfigProviderWave = { disabled: true } as const

/**
 * 공통 admin Ant Design theme.
 * colorSuccess / colorWarning / colorError는 앱 domain overlay에서 주입한다.
 */
export const adminTheme: ThemeConfig = {
  token: {
    colorPrimary: ADMIN_BRAND_PRIMARY,
    colorInfo: ADMIN_BRAND_PRIMARY,
    borderRadius: ADMIN_THEME_RADIUS.md,
    borderRadiusLG: ADMIN_THEME_RADIUS.lg,
    borderRadiusSM: ADMIN_THEME_RADIUS.sm,
    fontFamily: ADMIN_THEME_FONT.fontFamily,
    fontSize: ADMIN_THEME_FONT.fontSize,
    fontSizeLG: ADMIN_THEME_FONT.fontSizeLG,
    fontSizeSM: ADMIN_THEME_FONT.fontSizeSM,
  },
  components: {
    Button: {
      borderRadius: ADMIN_THEME_RADIUS.md,
    },
    Card: {
      borderRadius: ADMIN_THEME_RADIUS.lg,
    },
    Table: {
      borderRadius: ADMIN_THEME_RADIUS.lg,
      rowHoverBg: ADMIN_TABLE_ROW_BRAND_OVERLAY,
      rowSelectedBg: ADMIN_TABLE_ROW_BRAND_OVERLAY,
      rowSelectedHoverBg: ADMIN_TABLE_ROW_BRAND_OVERLAY,
    },
    Input: {
      borderRadius: ADMIN_THEME_RADIUS.md,
    },
    Select: {
      borderRadius: ADMIN_THEME_RADIUS.md,
    },
  },
  algorithm: theme.defaultAlgorithm,
}

export function mergeAdminTheme(overrides?: ThemeConfig): ThemeConfig {
  if (!overrides) return adminTheme
  return {
    ...adminTheme,
    ...overrides,
    token: {
      ...adminTheme.token,
      ...overrides.token,
    },
    components: {
      ...adminTheme.components,
      ...overrides.components,
    },
    algorithm: overrides.algorithm ?? adminTheme.algorithm,
  }
}
