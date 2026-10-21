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
  | '졸업'
  | '휴학'
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
  grade: UjatEducationProgressVolunteerGrade | ''
  regionKey: UjatInstitutionApplicationRegionKey
  regionLabel: string
  mobile: string
  email: string
  totalAssignedDays: number | null
  assignmentStatus: UjatEducationProgressVolunteerAssignmentStatus
  /** 1365 출석 조인용 */
  memberId?: string
  /** 1365 양식용 — 서버 미제공 시 빈 문자열 */
  birthDate?: string
  /** 1365 양식용 — 서버가 마스킹한 값 그대로 */
  id1365?: string
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
  '졸업',
  '휴학',
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
