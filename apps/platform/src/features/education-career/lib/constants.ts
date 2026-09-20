import type { CareerProgramId } from '../model/types'

export const EDUCATION_CAREER_PATH = '/education/career'

export const EDUCATION_CAREER_HERO = {
  label: '진로·취업 Work Readiness',
  titleLines: [
    '청소년이 자신의 진로를 주도적으로 탐색하고,',
    '성공적인 취업에 필요한 역량을 갖출 수 있도록 교육합니다.',
  ],
} as const

export const EDUCATION_CAREER_TAB_ITEMS: { key: CareerProgramId; label: string }[] = [
  { key: 'explore', label: '진로 탐색 프로그램' },
  { key: 'experience', label: '직무 체험 프로그램' },
  { key: 'strengthen', label: '취업 역량 강화 프로그램' },
]

export const DEFAULT_EDUCATION_CAREER_TAB: CareerProgramId = 'explore'
