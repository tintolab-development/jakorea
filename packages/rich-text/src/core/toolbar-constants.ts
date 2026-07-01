export type LineHeightValue = '100%' | '115%' | '150%' | '170%' | '200%'

export const LINE_HEIGHT_OPTIONS: { value: LineHeightValue | ''; label: string }[] = [
  { value: '', label: '기본' },
  { value: '100%', label: '100%' },
  { value: '115%', label: '115%' },
  { value: '150%', label: '150%' },
  { value: '170%', label: '170%' },
  { value: '200%', label: '200%' },
]

export type ListTypeValue = 'bullet' | 'ordered'

export const LIST_OPTIONS: { value: ListTypeValue; label: string }[] = [
  { value: 'bullet', label: '글머리 목록' },
  { value: 'ordered', label: '번호 목록' },
]

/** 툴바 빠른 선택용 이모지 (Tiptap emoji `name`) */
export const EMOJI_QUICK_PICK_NAMES = [
  'grinning',
  'joy',
  'heart_eyes',
  'thumbsup',
  'clap',
  'fire',
  'sparkles',
  'check_mark',
  'x',
  'warning',
  'bulb',
  'memo',
] as const
