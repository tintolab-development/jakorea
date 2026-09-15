/**
 * Individual screening OpenAPI enrich — Orval codegen 반영 전 FE 확장 타입.
 * codegen 동기화 후 generated schema로 교체 가능.
 */

import type { IndividualApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/individualApplicationListItemResponse'
import type { InterviewAssignmentCreateRequest } from '@/shared/api/generated/dashboard/schemas/interviewAssignmentCreateRequest'
import type { InterviewAssignmentResponse } from '@/shared/api/generated/dashboard/schemas/interviewAssignmentResponse'

/** GET individual-applications list item + P1 assigned interview enrich */
export type IndividualApplicationListItemEnriched = IndividualApplicationListItemResponse & {
  assignedInterviewSlotId?: number | null
  assignedInterviewStartAt?: string | null
  assignedInterviewEndAt?: string | null
}

/** POST /api/admin/interview-assignments — volunteer ↔ individual 상호 배타 */
export type InterviewAssignmentCreateRequestEnriched = InterviewAssignmentCreateRequest & {
  individualApplicationId?: number
}

export type InterviewAssignmentResponseEnriched = InterviewAssignmentResponse & {
  individualApplicationId?: number | null
}
