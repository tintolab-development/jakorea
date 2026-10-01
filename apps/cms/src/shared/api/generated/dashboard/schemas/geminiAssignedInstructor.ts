/**
 * Hand-updated from JABACK OpenAPI (2026-10-01 Gemini visiting-training detail handoff).
 * 승인 연수에 매칭된 강사 프로필. 미매칭이면 상위 assignedInstructor=null.
 */
export interface GeminiAssignedInstructor {
  /** @nullable */
  memberId?: number | null
  /** @nullable */
  name?: string | null
  /** @nullable */
  homeAddress?: string | null
  /** @nullable */
  experienceYears?: number | null
  /** @nullable */
  grade?: string | null
  /** @nullable */
  phone?: string | null
  /** @nullable */
  email?: string | null
}
