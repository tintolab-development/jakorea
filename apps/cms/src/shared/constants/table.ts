/**
 * 테이블 관련 상수
 * 컬럼 너비, 기본 설정 등
 */

export const TABLE_COLUMN_WIDTHS = {
  status: 110,
  date: 120,
  action: 72,
  checkbox: 60,
  index: 80,
  name: 120,
  email: 200,
  phone: 130,
  id: 100,
} as const

export const TABLE_CONFIG = {
  scroll: {
    x: 'max-content',
  },
  size: 'middle' as const,
  bordered: false,
} as const
