import { getLabel } from '../shared/option-helpers'
import type { DomainSelectOption } from '../shared/types'

export const RECRUITMENT_STATUS = {
  scheduled: 'scheduled',
  recruiting: 'recruiting',
  closed: 'closed',
} as const

export type RecruitmentStatus = (typeof RECRUITMENT_STATUS)[keyof typeof RECRUITMENT_STATUS]

export const RECRUITMENT_STATUS_OPTIONS: DomainSelectOption<RecruitmentStatus>[] = [
  { value: RECRUITMENT_STATUS.scheduled, label: '모집 예정' },
  { value: RECRUITMENT_STATUS.recruiting, label: '모집 중' },
  { value: RECRUITMENT_STATUS.closed, label: '모집 마감' },
]

export function getRecruitmentStatusLabel(value: RecruitmentStatus): string {
  return getLabel(RECRUITMENT_STATUS_OPTIONS, value)
}
