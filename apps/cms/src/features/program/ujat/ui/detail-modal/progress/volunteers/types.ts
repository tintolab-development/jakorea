import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'

/** 교육 배정 현황 */
export type UjatEducationProgressVolunteerAssignmentStatus =
  | 'assignment_waiting'
  | 'assignment_completed'
  | 'activity_abandoned'

export type UjatEducationProgressVolunteerGrade =
  | '1학년'
  | '2학년'
  | '3학년'
  | '4학년'
  | '휴학생'
  | '졸업유예'

/** 회원 관리 > 개인 회원 — 봉사자 추가 등록 셀렉트 옵션 */
export type UjatEducationProgressVolunteerMemberCandidate = {
  memberId: string
  volunteerName: string
  grade: UjatEducationProgressVolunteerGrade
  regionKey: UjatInstitutionApplicationRegionKey
  mobile: string
  email: string
}

export type UjatEducationProgressVolunteerRow = {
  id: string
  no: number
  volunteerName: string
  grade: UjatEducationProgressVolunteerGrade
  regionKey: UjatInstitutionApplicationRegionKey
  regionLabel: string
  mobile: string
  email: string
  totalAssignmentDays: number | null
  assignmentStatus: UjatEducationProgressVolunteerAssignmentStatus
}

export type UjatEducationProgressVolunteerFilters = {
  volunteerName: string
  grade: string
  regionKey: string
  assignmentStatus: string
}

export const UJAT_EDU_PROGRESS_VOLUNTEER_GRADE_OPTIONS = [
  '1학년',
  '2학년',
  '3학년',
  '4학년',
  '휴학생',
  '졸업유예',
] as const satisfies readonly UjatEducationProgressVolunteerGrade[]

export const UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL: Record<
  UjatEducationProgressVolunteerAssignmentStatus,
  string
> = {
  assignment_waiting: '배정 대기',
  assignment_completed: '배정 완료',
  activity_abandoned: '활동 포기',
}

export const EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS: UjatEducationProgressVolunteerFilters = {
  volunteerName: '',
  grade: '',
  regionKey: '',
  assignmentStatus: '',
}
