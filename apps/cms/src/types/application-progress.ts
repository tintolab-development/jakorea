/**
 * 신청 진행 상태 타입 정의
 * Phase 4.6: 상태 운영 관리
 */

// 신청 진행 상태 (승인 후 진행 단계)
export type ApplicationProgressStatus =
  | 'RECEIVED' // 접수 완료
  | 'MATCHING_IN_PROGRESS' // 매칭 진행중
  | 'MATCHING_COMPLETED' // 매칭 완료
  | 'MATERIAL_PREPARING' // 교재 배송 준비중
  | 'MATERIAL_SHIPPED' // 교재 발송 완료
  | 'IN_PROGRESS' // 교육 실시
  | 'SURVEY_SUBMITTED' // 만족도 조사 제출
  | 'REPORT_SUBMITTED' // 강의보고서 제출

/** Phase 0.2.4: 타임라인 표시 순서 (FR-D01) */
export const APPLICATION_PROGRESS_ORDER: ApplicationProgressStatus[] = [
  'RECEIVED',
  'MATCHING_IN_PROGRESS',
  'MATCHING_COMPLETED',
  'MATERIAL_PREPARING',
  'MATERIAL_SHIPPED',
  'IN_PROGRESS',
  'SURVEY_SUBMITTED',
  'REPORT_SUBMITTED',
]

// 상태 전이 규칙
export const PROGRESS_STATUS_TRANSITIONS: Record<ApplicationProgressStatus, ApplicationProgressStatus[]> = {
  RECEIVED: ['MATCHING_IN_PROGRESS'],
  MATCHING_IN_PROGRESS: ['MATCHING_COMPLETED'],
  MATCHING_COMPLETED: ['MATERIAL_PREPARING'],
  MATERIAL_PREPARING: ['MATERIAL_SHIPPED'],
  MATERIAL_SHIPPED: ['IN_PROGRESS'],
  IN_PROGRESS: ['SURVEY_SUBMITTED'],
  SURVEY_SUBMITTED: ['REPORT_SUBMITTED'],
  REPORT_SUBMITTED: [], // 최종 상태
}

// 상태 라벨
export const PROGRESS_STATUS_LABELS: Record<ApplicationProgressStatus, string> = {
  RECEIVED: '접수 완료',
  MATCHING_IN_PROGRESS: '매칭 진행중',
  MATCHING_COMPLETED: '매칭 완료',
  MATERIAL_PREPARING: '교재 배송 준비중',
  MATERIAL_SHIPPED: '교재 발송 완료',
  IN_PROGRESS: '교육 실시',
  SURVEY_SUBMITTED: '만족도 조사 제출',
  REPORT_SUBMITTED: '강의보고서 제출',
}

// 상태 색상
export const PROGRESS_STATUS_COLORS: Record<ApplicationProgressStatus, string> = {
  RECEIVED: 'blue',
  MATCHING_IN_PROGRESS: 'orange',
  MATCHING_COMPLETED: 'green',
  MATERIAL_PREPARING: 'purple',
  MATERIAL_SHIPPED: 'cyan',
  IN_PROGRESS: 'magenta',
  SURVEY_SUBMITTED: 'red',
  REPORT_SUBMITTED: 'default',
}

/**
 * 다음 가능한 상태 목록 반환
 */
export function getNextProgressStatuses(
  currentStatus: ApplicationProgressStatus
): ApplicationProgressStatus[] {
  return PROGRESS_STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * 상태 전이가 가능한지 확인
 */
export function canTransitionProgressStatus(
  from: ApplicationProgressStatus,
  to: ApplicationProgressStatus
): boolean {
  return PROGRESS_STATUS_TRANSITIONS[from]?.includes(to) || false
}
