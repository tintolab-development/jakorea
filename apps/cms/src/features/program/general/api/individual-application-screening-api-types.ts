/**
 * Individual screening OpenAPI enrich — Orval codegen 반영 전 FE 확장 타입.
 * codegen 동기화 후 generated schema로 교체 가능.
 */

import type { IndividualApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationListItemResponse'
import type { InterviewAssignmentCreateRequest } from '@/shared/api/generated/dashboard/schemas/interviewAssignmentCreateRequest'
import type { InterviewAssignmentResponse } from '@/shared/api/generated/dashboard/schemas/interviewAssignmentResponse'
import type { PreferredEducationScheduleResponse } from '@/shared/api/generated/dashboard/schemas/preferredEducationScheduleResponse'

/**
 * 희망 교육 일정. codegen에 `label`이 들어오기 전 확장.
 * 운영 일정 id는 label null, `line:N`은 educationScheduleLines 문자열.
 */
export type PreferredEducationSchedule = PreferredEducationScheduleResponse & {
  label?: string | null
  unresolvedReason?: 'AMBIGUOUS_SCHEDULE_MATCH' | 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' | null
}

/** GET individual-applications list item + P1 assigned interview enrich */
export type IndividualApplicationListItemEnriched = Omit<
  IndividualApplicationListItemResponse,
  'preferredEducationSchedules'
> & {
  assignedInterviewSlotId?: number | null
  assignedInterviewStartAt?: string | null
  assignedInterviewEndAt?: string | null
  preferredEducationSchedules?: PreferredEducationSchedule[]
  /** codegen 선행 — 목록 스냅샷 소속·학년 (BE가 applicationGrade 외 키로 내려줄 때) */
  affiliationSchool?: string | null
  schoolName?: string | null
  requestedGrade?: string | null
  educationGrade?: string | null
  grade?: string | null
  affiliationGrade?: string | null
  profile?: {
    affiliationSchool?: string | null
    affiliationGrade?: string | null
    schoolName?: string | null
    grade?: string | null
  }
}

/** POST /api/admin/interview-assignments — volunteer ↔ individual 상호 배타 */
export type InterviewAssignmentCreateRequestEnriched = InterviewAssignmentCreateRequest & {
  individualApplicationId?: number
}

export type InterviewAssignmentResponseEnriched = InterviewAssignmentResponse & {
  individualApplicationId?: number | null
}
