import type { FinanceProgramId } from '../model/types'

export const EDUCATION_FINANCE_PATH = '/education/finance'

export const EDUCATION_FINANCE_HERO = {
  label: '경제·금융 Financial Health',
  titleLines: [
    '청소년이 시장경제의 원리를 이해하고 경제 지식을 습득해',
    '생활 속에서 합리적인 의사 결정을 할 수 있도록 돕습니다.',
  ],
} as const

export const EDUCATION_FINANCE_TAB_ITEMS: { key: FinanceProgramId; label: string }[] = [
  { key: 'ujat', label: '대학생 경제교육봉사단 UJAT' },
  { key: 'employee', label: '임직원 참여형 경제·금융 교육' },
  { key: 'instructor', label: '강사 파견 경제·금융 교육' },
]

export const DEFAULT_EDUCATION_FINANCE_TAB: FinanceProgramId = 'ujat'
