import type {
  EducationApplicationTab,
  EducationDisplayStatus,
  EducationDisplayStatusTone,
} from '../model/education-application-types'

export const EDUCATION_DISPLAY_STATUS_LABEL: Record<EducationDisplayStatus, string> = {
  waiting_result: '결과 대기',
  document_passed: '서류 합격',
  in_progress: '진행중',
  completed: '진행 완료',
  withdrawn: '활동 포기',
  rejected: '신청 반려',
}

/** 목록 정렬: 결과 대기 → … → 신청 반려 */
export const EDUCATION_DISPLAY_STATUS_SORT_ORDER: Record<EducationDisplayStatus, number> = {
  waiting_result: 0,
  document_passed: 1,
  in_progress: 2,
  completed: 3,
  withdrawn: 4,
  rejected: 5,
}

export const EDUCATION_DISPLAY_STATUS_TONE: Record<
  EducationDisplayStatus,
  EducationDisplayStatusTone
> = {
  waiting_result: 'pending',
  document_passed: 'pending',
  in_progress: 'progress',
  completed: 'completed',
  withdrawn: 'completed',
  rejected: 'rejected',
}

export const EDUCATION_DISPLAY_STATUS_TONE_CLASS: Record<EducationDisplayStatusTone, string> = {
  pending: 'statusPending',
  progress: 'statusProgress',
  completed: 'statusCompleted',
  rejected: 'statusRejected',
}

/** 탭 분류 — API `statusGroup` 연동 시 동일 기준 유지 */
export function resolveEducationApplicationTab(
  status: EducationDisplayStatus,
): Exclude<EducationApplicationTab, 'all'> {
  switch (status) {
    case 'waiting_result':
    case 'document_passed':
      return 'applied'
    case 'in_progress':
      return 'in_progress'
    case 'completed':
    case 'withdrawn':
    case 'rejected':
      return 'completed'
  }
}

export function getEducationDisplayStatusLabel(status: EducationDisplayStatus): string {
  return EDUCATION_DISPLAY_STATUS_LABEL[status]
}

export function getEducationDisplayStatusTone(status: EducationDisplayStatus): EducationDisplayStatusTone {
  return EDUCATION_DISPLAY_STATUS_TONE[status]
}

/**
 * 신청 취소 가능 — 승인·반려 처리 **전**만.
 * 결과 대기 / 서류 합격. 반려·진행중·완료·포기 등은 버튼 비노출.
 */
export function canCancelEducationApplication(status: EducationDisplayStatus): boolean {
  return status === 'waiting_result' || status === 'document_passed'
}

/**
 * 신청 내용 탭 실 UI — 결과 대기 / 서류 합격만.
 * 신청 반려 등은 placeholder.
 */
export function canShowEducationApplicationContent(status: EducationDisplayStatus): boolean {
  return status === 'waiting_result' || status === 'document_passed'
}
