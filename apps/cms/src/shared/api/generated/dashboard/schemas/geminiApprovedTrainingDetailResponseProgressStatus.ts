/**
 * Hand-updated from JABACK OpenAPI (2026-10-01 Gemini visiting-training detail handoff).
 */
export type GeminiApprovedTrainingDetailResponseProgressStatus =
  (typeof GeminiApprovedTrainingDetailResponseProgressStatus)[keyof typeof GeminiApprovedTrainingDetailResponseProgressStatus]

export const GeminiApprovedTrainingDetailResponseProgressStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  NOT_CONDUCTED: 'NOT_CONDUCTED',
} as const
