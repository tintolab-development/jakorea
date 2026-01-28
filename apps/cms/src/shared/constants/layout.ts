/**
 * 레이아웃 관련 상수
 * 스타일 값, 너비, 간격, 폰트 크기 등 중앙 관리
 */

export const LAYOUT_CONSTANTS = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  widths: {
    search: 250,
    filter: 150,
    status: 110,
    action: 72,
    date: 120,
    modal: {
      small: 520,
      medium: 720,
      large: 960,
      xlarge: 1100,
    },
  },
  fontSizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
  },
  margins: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
} as const
