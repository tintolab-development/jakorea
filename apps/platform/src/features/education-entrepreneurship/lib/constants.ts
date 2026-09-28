import type { EntrepreneurshipProgramId } from '../model/types'

export const EDUCATION_ENTREPRENEURSHIP_PATH = '/education/entrepreneurship'

export const EDUCATION_ENTREPRENEURSHIP_HERO = {
  label: '기업가정신 Entrepreneurship',
  titleLines: [
    '청소년이 기업과 기업가의 사회적 역할 및 기능을 이해하고,',
    '기업가정신의 핵심 역량을 갖출 수 있도록 맞춤형 체험 교육을 제공합니다.',
  ],
} as const

export const EDUCATION_ENTREPRENEURSHIP_TAB_ITEMS: {
  key: EntrepreneurshipProgramId
  label: string
}[] = [
  { key: 'startup', label: '실물 창업 프로그램' },
  { key: 'contest', label: '비즈니스 경연대회' },
  { key: 'elementary', label: '초·중등 기업가정신 교육' },
]

export const DEFAULT_EDUCATION_ENTREPRENEURSHIP_TAB: EntrepreneurshipProgramId = 'startup'
