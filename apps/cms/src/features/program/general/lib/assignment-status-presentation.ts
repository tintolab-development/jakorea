import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from './waiting-instructor-assignment'
import { PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_STATUS_LABELS } from './participating-individual-instructor-assignment-types'
import { waitingAssignmentStatusLabel } from './instructor-assignment-availability'
import type { InstructorWaitingAssignmentStatus } from './instructor-institution-assignment'

export const INSTRUCTOR_ASSIGNMENT_STATUS_LABELS: Record<InstructorWaitingAssignmentStatus, string> = {
  waiting: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS.waiting,
  cancelled: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS.unavailable,
  assigned: '배정 완료',
  no_assignable_schedule: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS.no_assignable_schedule,
  unavailable: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS.unavailable,
  assignment_cancelled: '배정 취소',
}
export type ProgramAssignmentTextContext = 'school-instructor' | 'instructor-institution' | 'instructor-individual' | 'institution-volunteer' | 'individual-volunteer' | 'company-school-applicant'
const GREEN = 'var(--Status-green-main, #1e8c29)'
const BLACK = 'var(--Netural-black, #3d3d3d)'
const DEFAULT_BLACK = 'var(--default-BK, #3d3d3d)'
const RED = 'var(--Status-red-main, #c32f4a)'
const INSTRUCTOR_ACCENT: Record<string, string> = { waiting: GREEN, assigned: BLACK, cancelled: DEFAULT_BLACK, unavailable: DEFAULT_BLACK, assignment_cancelled: DEFAULT_BLACK }
const LABELS: Record<ProgramAssignmentTextContext, Record<string, string>> = {
  'school-instructor': WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS,
  'instructor-institution': INSTRUCTOR_ASSIGNMENT_STATUS_LABELS,
  'instructor-individual': PARTICIPATING_INDIVIDUAL_INSTRUCTOR_WAITING_STATUS_LABELS,
  'institution-volunteer': WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS,
  'individual-volunteer': WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS,
  'company-school-applicant': WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS,
}
const ACCENT: Record<ProgramAssignmentTextContext, Record<string, string>> = {
  'school-instructor': { waiting: GREEN, unavailable: DEFAULT_BLACK },
  'instructor-institution': INSTRUCTOR_ACCENT,
  'instructor-individual': INSTRUCTOR_ACCENT,
  'institution-volunteer': {},
  // 기존 unavailable -> cancelled CSS 매핑의 적색을 보존. 비활성 unavailable override를 정상화하지 않는다.
  'individual-volunteer': { waiting: GREEN, unavailable: RED },
  'company-school-applicant': {},
}
export function getProgramAssignmentStatusTextPresentation(status: string, context: ProgramAssignmentTextContext, serverLabel?: string) {
  const labels = LABELS[context]
  const usesServerLabel = context === 'instructor-institution' || context === 'instructor-individual'
  return {
    label: usesServerLabel ? waitingAssignmentStatusLabel(status, labels, serverLabel) : labels[status],
    // 미정의 class는 종전과 같이 상속색. 새 상태나 문구를 추정하지 않는다.
    accentColor: ACCENT[context][status] ?? 'inherit',
    opacity: context === 'school-instructor' && status === 'unavailable' ? 0.6 : undefined,
  }
}
/** 행 전체 약화는 Text opacity와 별도. 기존 상태선택/CTA 조건은 소비처에 그대로 둔다. */
export function getProgramAssignmentRowClass(status: string, context: ProgramAssignmentTextContext): string {
  const unavailable = status === 'unavailable' || (context === 'instructor-individual' && status === 'assignment_cancelled')
  if (!unavailable || context === 'institution-volunteer' || context === 'instructor-institution') return ''
  return 'program-assignment-row--unavailable' + (context === 'individual-volunteer' ? ' program-assignment-row--individual-volunteer' : '')
}
