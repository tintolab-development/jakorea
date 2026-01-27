/**
 * 위젯 공통 스타일 상수
 */

import { uiColors } from './colors'

// 더보기 버튼 공통 스타일
export const MORE_BUTTON_STYLES = {
  color: uiColors.moreButton,
  fontSize: '13px',
  padding: 0,
  textDecoration: 'underline',
  border: 'none',
  boxShadow: 'none',
  height: 'auto',
} as const

export const MORE_BUTTON_HOVER_STYLES = {
  color: uiColors.moreButtonHover,
  textDecoration: 'underline',
} as const
