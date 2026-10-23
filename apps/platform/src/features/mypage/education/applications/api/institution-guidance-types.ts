/** Portal PATCH …/application-answers — OpenAPI 최소 타입 (CMS generated import 금지) */

import type { PortalUjatTemporaryScheduleSlot } from './types'

export type OrganizationGuidanceAnswersPatchRequestAnswers = Record<string, unknown>

export type OrganizationGuidanceAnswersPatchRequest = {
  answers: OrganizationGuidanceAnswersPatchRequestAnswers
}

export type OrganizationGuidanceAnswersPatchResponse = {
  organizationApplicationId?: number
  formResponseId?: number
  answers?: OrganizationGuidanceAnswersPatchRequestAnswers
  formResponseStatus?: string
}

/** POST …/ujat/temporary-schedule/confirm 응답 */
export type UjatTemporaryScheduleConfirmResponse = {
  programId?: number | null
  organizationApplicationId?: number | null
  applicationStatus?: string | null
  temporaryAssignmentStatus?: string | null
  institutionConfirmationStatus?: string | null
  portalBannerState?: string | null
  assignmentRevision?: number | null
  institutionConfirmedAt?: string | null
  assignmentLockedAt?: string | null
  slots?: PortalUjatTemporaryScheduleSlot[]
}
