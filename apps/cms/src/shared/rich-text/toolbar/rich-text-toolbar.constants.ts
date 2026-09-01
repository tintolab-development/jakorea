export type { LineHeightValue, ListTypeValue } from '@jakorea/rich-text'
export { LINE_HEIGHT_OPTIONS, LIST_OPTIONS } from '@jakorea/rich-text'

export type HeadingLevel = 'p' | '1' | '2' | '3'

export type TextAlignValue = 'left' | 'center' | 'right' | 'justify'

export const FONT_FAMILY_OPTIONS = [
  { value: '', label: '기본' },
  { value: 'Pretendard, sans-serif', label: 'Pretendard' },
  { value: '"Malgun Gothic", sans-serif', label: '맑은 고딕' },
  { value: '"Apple SD Gothic Neo", sans-serif', label: 'Apple SD Gothic Neo' },
  { value: '"Noto Sans KR", sans-serif', label: 'Noto Sans KR' },
  { value: 'Georgia, serif', label: 'Serif' },
] as const

export const FONT_SIZE_OPTIONS = [
  { value: '', label: '기본' },
  { value: '12px', label: '12' },
  { value: '14px', label: '14' },
  { value: '15px', label: '15' },
  { value: '16px', label: '16' },
  { value: '18px', label: '18' },
  { value: '20px', label: '20' },
  { value: '24px', label: '24' },
] as const

export const HEADING_OPTIONS: { value: HeadingLevel; label: string; triggerLabel: string }[] = [
  { value: 'p', label: '본문', triggerLabel: '본문' },
  { value: '1', label: '제목 1', triggerLabel: 'H₁' },
  { value: '2', label: '제목 2', triggerLabel: 'H₂' },
  { value: '3', label: '제목 3', triggerLabel: 'H₃' },
]

export const TEXT_COLOR_OPTIONS = [
  { value: '', label: '기본' },
  { value: '#3D3D3D', label: '검정' },
  { value: '#01A1AF', label: '민트' },
  { value: '#E53935', label: '빨강' },
  { value: '#1565C0', label: '파랑' },
  { value: '#2E7D32', label: '초록' },
  { value: '#6A1B9A', label: '보라' },
  { value: '#F57C00', label: '주황' },
] as const

export const HIGHLIGHT_OPTIONS = [
  { value: '', label: '없음' },
  { value: '#FFF9C4', label: '노랑' },
  { value: '#E8F5E9', label: '연두' },
  { value: '#E3F2FD', label: '하늘' },
  { value: '#FCE4EC', label: '분홍' },
  { value: '#EEEEEE', label: '회색' },
] as const

export const TEXT_ALIGN_OPTIONS: {
  value: TextAlignValue
  label: string
}[] = [
  { value: 'left', label: '왼쪽 정렬' },
  { value: 'center', label: '가운데 정렬' },
  { value: 'right', label: '오른쪽 정렬' },
  { value: 'justify', label: '양쪽 정렬' },
]
