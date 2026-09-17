import type { ApplicantPreferredScheduleBlock } from '@/features/program/shared/model/applicant-institution'

/**
 * 참여 학교 — 타입 및 라벨/옵션 상수
 */

export type TextbookStatusKey = 'preparing' | 'shipping' | 'delivered' | 'not_applicable'

/** 참여 기관 승인/반려 상태 (선택 승인·선택 반려·승인 취소 연동) */
export type ParticipatingSchoolApprovalStatusKey = 'pending' | 'rejected' | 'approved' | 'cancelled'

/** 강의 회차별 진행 상태 (교육기관 상세 신청 정보 탭용) */
export type ParticipatingSchoolSessionStatusKey = 'completed' | 'pending' | 'not_planned'

/** 강의 회차별 교육 진행 일정 한 건 (참여 기관 테이블용) */
export interface ParticipatingSchoolSession {
  round: number
  date: string
  dayOfWeek: string
  duration: string
  format: string
  classNum: string
  timeRange: string
  /** 진행 완료 | 진행 대기 | 미진행 희망 (상세 뷰용, 선택) */
  status?: ParticipatingSchoolSessionStatusKey
  /** Admin requested-schedules.id — 배정 create requestedScheduleId */
  requestedScheduleId?: number
  /** program_schedule 매핑. null = 일정 미생성 (필드가 내려온 경우만) */
  resolvedScheduleId?: number | null
  /** resolvedScheduleId === null 일 때 true */
  scheduleUnresolved?: boolean
}

export interface ParticipatingSchoolRow {
  id: string
  /** BE 기관 ID — 참여/신청 PK와 구분 */
  organizationId?: number
  /** BE 담당 교사 회원 ID */
  teacherMemberId?: number
  no: number
  schoolName: string
  region: string
  educationGrade: string
  classCount: number
  studentCount: number
  lectureRound: string
  textbookStatus: TextbookStatusKey
  /** 참여 승인/반려 상태 (선택 승인·선택 반려 연동) */
  approvalStatus: ParticipatingSchoolApprovalStatusKey
  teacherName: string
  instructors: string
  /** 강의 회차 별 교육 진행 날짜 및 시간 (참여 기관 페이지 컬럼용) */
  sessions?: ParticipatingSchoolSession[]
  /** 프로그램 ID (교육받은 교사 등 프로그램별 참여 기관 필터용) */
  programId?: string
  /** 기관 신청 ID — 강사 배정 create/list 스코프 */
  organizationApplicationId?: string
  /** BE participantStatus (예: APPROVED · GIVE_UP) */
  participantStatus?: string
  /** 활동 포기 시각 (ISO) */
  giveUpAt?: string
  /** 활동 포기 처리 여부 */
  activityWithdrawn?: boolean
  /**
   * BE `availableActions` (additive). codegen 미반영 시 adapter가 느슨히 매핑.
   * 참여 기관 활동 포기 게이트: `GIVE_UP`
   */
  availableActions?: string[]
  /** TT 희망 교육 일정 structured blocks (org-application SoT) */
  preferredScheduleBlocks?: ApplicantPreferredScheduleBlock[]
  /** TT 교육 대상 */
  educationTarget?: string
  /** TT 진행 상태 라벨 (progressLabel SoT) */
  progressLabel?: string
  /** TT 전체 교육 일정 수. 최소 0 — 결측 아님. */
  totalEducationRoundCount?: number
  /** TT 완료 교육 일정 수. 최소 0. */
  completedEducationRoundCount?: number
  /** TT 교재명 */
  textbookName?: string
  /** TT 교육일지 수. 최소 0. */
  educationJournalCount?: number
  journalSubmitted?: boolean
  /** TT 교육 완료 건수. 최소 0. */
  educationCompletionCount?: number
}

export const TEXTBOOK_STATUS_LABELS: Record<TextbookStatusKey, string> = {
  preparing: '교재 배송 전',
  shipping: '교재 배송 중',
  delivered: '교재 배송 완료',
  not_applicable: '해당 없음',
}

/** 참여 기관 목록의 교재 배송 현황 표기 — 화면 정의서 문구 */
export const PARTICIPATING_INSTITUTION_TEXTBOOK_STATUS_LABELS: Record<
  Exclude<TextbookStatusKey, 'not_applicable'>,
  string
> = {
  preparing: '배송 전',
  shipping: '배송 중',
  delivered: '배송 완료',
}

/** StatusDropdownCell·필터 셀렉트 등 옵션 순서 */
export const TEXTBOOK_STATUS_OPTION_KEYS: TextbookStatusKey[] = [
  'preparing',
  'shipping',
  'delivered',
  'not_applicable',
]

/** Mock 시드 제거 — 빈 배열 */
export const MOCK_PARTICIPATING_SCHOOLS: ParticipatingSchoolRow[] = []

export function getParticipatingSchoolsForProgram(
  _programId: string
): ParticipatingSchoolRow[] {
  return []
}
