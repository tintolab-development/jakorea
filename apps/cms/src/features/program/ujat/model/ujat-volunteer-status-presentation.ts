import { getInterviewAssignmentTextAccent } from '@/features/program/shared/lib/volunteer-screening/interview-assignment-text-presentation'
import {
  UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS,
  type UjatInterviewAssignmentStatus,
} from './ujat-volunteer-screening-constants'

/** 서로 다른 업무축은 raw key를 통합하지 않고 Text 표현만 공통 primitive에 공급한다. */
const GREEN = 'var(--Status-green-main, #1e8c29)'
const BLACK = 'var(--Netural-black, #3d3d3d)'
const RED = 'var(--Status-red-main, #c32f4a)'

export { getDocumentScreeningTextPresentation as getUjatDocumentScreeningTextPresentation } from '@/features/program/shared/lib/volunteer-screening/document-screening-presentation'
export function getUjatInterviewAssignmentTextPresentation(status: UjatInterviewAssignmentStatus) {
  return { label: UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS[status], accentColor: getInterviewAssignmentTextAccent(status) }
}

export type UjatEducationProgressVolunteerAssignmentStatus = 'assignment_waiting' | 'assignment_completed' | 'activity_abandoned'
export const UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL: Record<UjatEducationProgressVolunteerAssignmentStatus, string> = {
  assignment_waiting: '배정 대기', assignment_completed: '배정 완료', activity_abandoned: '활동 포기',
}
const EDUCATION_ASSIGNMENT_ACCENT: Record<UjatEducationProgressVolunteerAssignmentStatus, string> = {
  assignment_waiting: GREEN, assignment_completed: BLACK, activity_abandoned: RED,
}
export function getUjatEducationVolunteerAssignmentTextPresentation(status: UjatEducationProgressVolunteerAssignmentStatus) {
  return { label: UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL[status], accentColor: EDUCATION_ASSIGNMENT_ACCENT[status] }
}
