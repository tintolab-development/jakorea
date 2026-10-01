/**
 * Hand-updated from JABACK OpenAPI (2026-10-01 Gemini visiting-training detail handoff).
 * Prefer regenerating via Orval when dashboard filter includes these paths.
 */
import type { GeminiApprovedTrainingDetailResponseProgressStatus } from './geminiApprovedTrainingDetailResponseProgressStatus'
import type { GeminiApprovedTrainingDetailResponseTeacherEmploymentStatus } from './geminiApprovedTrainingDetailResponseTeacherEmploymentStatus'
import type { GeminiAssignedInstructor } from './geminiAssignedInstructor'

/**
 * Gemini 승인 연수 상세. id=organizationApplicationId.
 * 전화·이메일·계좌·상세주소는 목록에 넣지 않는다. 없는 값은 null.
 */
export interface GeminiApprovedTrainingDetailResponse {
  id?: number
  /** 모집 공고 programId. 담당자 LNB managers API에 이 값을 쓴다. */
  programId?: number
  organizationApplicationId?: number
  /** @nullable */
  recruitmentId?: number | null
  /** @nullable */
  recruitmentTitle?: string | null
  /** @nullable */
  recruitmentDescription?: string | null
  /** @nullable */
  progressStatus?: GeminiApprovedTrainingDetailResponseProgressStatus
  /** @nullable */
  applicationStatus?: string | null
  /** @nullable */
  institutionName?: string | null
  /** @nullable */
  institutionSido?: string | null
  /** @nullable */
  institutionSigungu?: string | null
  /** @nullable */
  institutionAddress?: string | null
  /** @nullable */
  institutionAddressDetail?: string | null
  /** @nullable */
  institutionApplicationCount?: number | null
  /** @nullable */
  institutionCompletedTrainingCount?: number | null
  /** @nullable */
  institutionJoinedAt?: string | null
  /** @nullable */
  scheduleId?: number | null
  /** @nullable */
  scheduleName?: string | null
  /** @nullable */
  trainingDate?: string | null
  /** @nullable */
  trainingStartTime?: string | null
  /** @nullable */
  trainingEndTime?: string | null
  /** @nullable */
  trainingTimeText?: string | null
  /** @nullable */
  lastPreferredDate?: string | null
  /** @nullable */
  studentCount?: number | null
  /** @nullable */
  classCount?: number | null
  /** @nullable */
  requestedScheduleMemo?: string | null
  /** @nullable */
  instructorMemberId?: number | null
  /** @nullable */
  instructorName?: string | null
  assignedInstructor?: GeminiAssignedInstructor | null
  /**
   * @deprecated
   * @nullable
   */
  managerAdminId?: number | null
  /**
   * teacherName 별칭
   * @deprecated
   * @nullable
   */
  managerName?: string | null
  /** @nullable */
  teacherMemberId?: number | null
  /** @nullable */
  teacherName?: string | null
  /** @nullable */
  teacherGender?: string | null
  /** @nullable */
  teacherBirthDate?: string | null
  /** @nullable */
  teacherPhone?: string | null
  /** @nullable */
  teacherEmail?: string | null
  /** @nullable */
  teacherSchoolName?: string | null
  /** @nullable */
  teacherEmploymentStatus?: GeminiApprovedTrainingDetailResponseTeacherEmploymentStatus
  /** @nullable */
  teacherPosition?: string | null
  /** @nullable */
  teacherSubject?: string | null
  /** @nullable */
  teacherHomeAddress?: string | null
  /** @nullable */
  teacherScheduleChangeCount?: number | null
  /** @nullable */
  teacherLectureExperience?: string | null
  /** @nullable */
  teacherAccountBank?: string | null
  /** @nullable */
  teacherAccountNumber?: string | null
  /** @nullable */
  teacherAccountHolder?: string | null
  /** @nullable */
  teacherInstructorFeeGrade?: string | null
  /** @nullable */
  teacherBusinessIncomeLabel?: string | null
  /** @nullable */
  teacherOneLineIntro?: string | null
  /** @nullable */
  officialDocumentRequired?: boolean | null
  /** @nullable */
  submittedAt?: string | null
  /** @nullable */
  approvedAt?: string | null
  /** @nullable */
  updatedAt?: string | null
}
