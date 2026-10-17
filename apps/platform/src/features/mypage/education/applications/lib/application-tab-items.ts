import type { EducationApplicationTab } from '../model/types'

export const EDUCATION_APPLICATION_TAB_ITEMS = [
  { key: 'all', label: '전체' },
  { key: 'applied', label: '신청한 프로그램' },
  { key: 'in_progress', label: '진행중인 프로그램' },
  { key: 'completed', label: '종료된 프로그램' },
] as const satisfies ReadonlyArray<{ key: EducationApplicationTab; label: string }>
