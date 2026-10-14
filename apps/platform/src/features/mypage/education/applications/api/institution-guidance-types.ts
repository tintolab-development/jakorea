/** Portal PATCH …/application-answers — OpenAPI 최소 타입 (CMS generated import 금지) */

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
