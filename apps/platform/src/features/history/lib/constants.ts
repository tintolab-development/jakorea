import { IMPACT_STORIES_PATH } from '@/features/impact-story'
import { PROGRAMS_PATH } from '@/features/program'

export const HISTORY_PATH = '/about/history'

export const HISTORY_HERO_EYEBROW = 'JA History'

export const HISTORY_HERO_TITLE_LINES = [
  'BOUNDLESS YOUTH;',
  'THRIVING COMMUNITIES',
] as const

export const HISTORY_CTA_PRIMARY = {
  label: '교육 프로그램 살펴보기',
  href: PROGRAMS_PATH,
} as const

export const HISTORY_CTA_SECONDARY = {
  label: 'JA Impact 살펴보기',
  href: IMPACT_STORIES_PATH,
} as const
