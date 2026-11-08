import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'

import type { UjatEducationProgressVolunteerAssignmentStatus } from '@/features/program/ujat/model/ujat-volunteer-status-presentation'
export type { UjatEducationProgressVolunteerAssignmentStatus } from '@/features/program/ujat/model/ujat-volunteer-status-presentation'
export { UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL } from '@/features/program/ujat/model/ujat-volunteer-status-presentation'

export type UjatEducationProgressVolunteerGrade =
  | '1학년'
  | '2학년'
  | '3학년'
  | '4학년'
  | '졸업'
  | '휴학'
  | '졸업유예'

/** 봉사자 추가 등록 셀렉트 옵션 — GET …/participant-register-candidates */
export type UjatEducationProgressVolunteerMemberCandidate = {
  memberId: string
  volunteerName: string
  /** 회원 프로필에 1365 ID가 이미 등록되어 있으면 true */
  hasRegisteredId1365?: boolean
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

export const EMPTY_UJAT_EDU_PROGRESS_VOLUNTEER_FILTERS: UjatEducationProgressVolunteerFilters = {
  volunteerName: '',
  grade: '',
  regionKey: '',
  assignmentStatus: '',
}
