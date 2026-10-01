/**
 * Hand-updated from JABACK OpenAPI (2026-10-01 Gemini visiting-training detail handoff).
 * @nullable
 */
export type GeminiApprovedTrainingDetailResponseTeacherEmploymentStatus =
  | (typeof GeminiApprovedTrainingDetailResponseTeacherEmploymentStatus)[keyof typeof GeminiApprovedTrainingDetailResponseTeacherEmploymentStatus]
  | null

export const GeminiApprovedTrainingDetailResponseTeacherEmploymentStatus = {
  ACTIVE: 'ACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  TRANSFERRED: 'TRANSFERRED',
  INACTIVE: 'INACTIVE',
  RESIGNED: 'RESIGNED',
  WITHDRAWN: 'WITHDRAWN',
} as const
