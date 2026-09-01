import type { FaqCategory } from '../model/types'

export const MYPAGE_INQUIRIES_BASE_PATH = '/mypage/inquiries'

export const FAQ_PAGE_SIZE = 8

export const INQUIRY_PAGE_SIZE = 8

export const FAQ_CATEGORY_OPTIONS: readonly { value: FaqCategory | '전체'; label: string }[] = [
  { value: '전체', label: '전체' },
  { value: '프로그램', label: '프로그램' },
  { value: '계정', label: '계정' },
  { value: '정산', label: '정산' },
  { value: '회원가입', label: '회원가입' },
] as const

export const INQUIRY_PROGRAM_OPTIONS = [
  { value: '2026-ja-camp', label: '2026 JA 경제교육 캠프' },
  { value: '2026-ujat', label: '2026 UJAT 봉사 프로그램' },
  { value: '2025-settlement', label: '2025 하반기 강사 정산' },
  { value: 'none', label: '해당 없음' },
] as const

export const INQUIRY_CATEGORY_OPTIONS = FAQ_CATEGORY_OPTIONS.filter(
  option => option.value !== '전체',
)

export const INQUIRY_TAB_ITEMS = [
  { key: 'faq', label: 'FAQ' },
  { key: 'inquiry', label: '1:1 문의하기' },
] as const

export const DEFAULT_INQUIRY_LIST_PARAMS = {
  tab: 'faq',
  category: '전체',
  page: 1,
} as const
