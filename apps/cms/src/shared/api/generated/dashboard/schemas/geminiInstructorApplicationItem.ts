/**
 * Hand-updated from JABACK OpenAPI (2026-10-01 Gemini visiting-training detail handoff).
 * Gemini 강사 신청 목록 행. 승인 연수 상세 LNB와 모집 단위 목록이 공유한다.
 */
export interface GeminiInstructorApplicationItem {
  applicationId?: number
  programId?: number
  /** @nullable */
  recruitmentId?: number | null
  /** @nullable */
  instructorMemberId?: number | null
  /** @nullable */
  instructorName?: string | null
  /** PENDING|APPROVED|REJECTED */
  applicationStatus?: string
  /** @nullable */
  instructorTypeSnapshot?: string | null
  /** @nullable */
  instructorFeeGradeSnapshot?: string | null
  /** @nullable */
  grade?: string | null
  /** @nullable */
  homeSido?: string | null
  /** @nullable */
  homeSigungu?: string | null
  /** @nullable */
  experienceYears?: number | null
  /** @nullable */
  phone?: string | null
  /** @nullable */
  email?: string | null
  /** @nullable */
  monthlyAssignmentCount?: number | null
  /** @nullable */
  distanceKm?: number | null
  /** @nullable */
  longDistance?: boolean | null
  /** @nullable */
  availableScheduleMemo?: string | null
  /** @nullable */
  submittedAt?: string | null
  /** @nullable */
  approvedAt?: string | null
  /** @nullable */
  rejectedAt?: string | null
}
