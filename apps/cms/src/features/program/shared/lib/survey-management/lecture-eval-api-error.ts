import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'

/** 강의평가(LECTURE_EVALUATION) 서버 오류 코드 — BE 회신 2026-11-11 */
export const LECTURE_EVAL_API_ERROR_CODE = {
  /** 403 — 다른 관리자 응답 PATCH·DELETE (Master 포함) */
  responseNotOwner: 'FORM_RESPONSE_NOT_OWNER',
  /** 409 — 종료(FINISHED) 전 summary */
  resultsNotAvailable: 'FORM_RESULTS_NOT_AVAILABLE',
  /** 409 — submissionEndAt 이후 답변 수정 */
  editPeriodEnded: 'LECTURE_EVALUATION_EDIT_PERIOD_ENDED',
  /** 409 — submissionStartAt 전 관리자 제출 */
  submissionNotStarted: 'FORM_SUBMISSION_NOT_STARTED',
  /** 409 — submissionEndAt 이후 관리자 제출 */
  submissionClosed: 'FORM_SUBMISSION_CLOSED',
  /** 409 — 이미 삭제(CANCELLED)된 응답 PATCH·DELETE */
  responseNotMutable: 'FORM_RESPONSE_NOT_MUTABLE',
  /** 409 — 같은 관리자 재제출 */
  alreadySubmitted: 'FORM_RESPONSE_ALREADY_SUBMITTED',
} as const

export type LectureEvalApiErrorCode =
  (typeof LECTURE_EVAL_API_ERROR_CODE)[keyof typeof LECTURE_EVAL_API_ERROR_CODE]

/** 제출·수정 거절 중 화면 상태(진행 상태·내 응답)가 서버와 어긋난 경우 — 바인딩·응답 목록을 다시 불러온다. */
const STALE_STATE_CODES = new Set<string>([
  LECTURE_EVAL_API_ERROR_CODE.responseNotOwner,
  LECTURE_EVAL_API_ERROR_CODE.editPeriodEnded,
  LECTURE_EVAL_API_ERROR_CODE.responseNotMutable,
  LECTURE_EVAL_API_ERROR_CODE.submissionNotStarted,
  LECTURE_EVAL_API_ERROR_CODE.submissionClosed,
  LECTURE_EVAL_API_ERROR_CODE.alreadySubmitted,
])

export function isLectureEvalStaleStateError(error: unknown): boolean {
  const code = getApiErrorCode(error)
  return code != null && STALE_STATE_CODES.has(code)
}

export function isLectureEvalResultsNotAvailableError(error: unknown): boolean {
  return getApiErrorCode(error) === LECTURE_EVAL_API_ERROR_CODE.resultsNotAvailable
}
