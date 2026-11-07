import { LECTURE_REPORT_PREVIEW_ASSIGNMENT_QUERY_KEY } from './lecture-report-preview-url'

export function lectureReportWritePath(
  applicationId: string,
  assignmentId: number,
  mode: 'write' | 'preview' | 'read' = 'write',
): string {
  const params = new URLSearchParams({ assignmentId: String(assignmentId) })
  if (mode !== 'write') params.set('mode', mode)
  return `/mypage/lectures/INSTRUCTOR/${encodeURIComponent(applicationId)}/lecture-report/write?${params.toString()}`
}

export function lectureReportBackPath(applicationId: string): string {
  const id = applicationId.trim()
  if (!id) return '/mypage/lectures'
  return `/mypage/lectures/INSTRUCTOR/${encodeURIComponent(id)}?section=lecture-report`
}

/** 강의 상세(강의보고서 탭)에서 미리보기 모달을 열 때 */
export function lectureReportPreviewPath(applicationId: string, assignmentId: number): string {
  const params = new URLSearchParams({
    section: 'lecture-report',
    [LECTURE_REPORT_PREVIEW_ASSIGNMENT_QUERY_KEY]: String(assignmentId),
  })
  return `/mypage/lectures/INSTRUCTOR/${encodeURIComponent(applicationId)}?${params.toString()}`
}

/** 제출 완료 후 강의 상세로 돌아올 때 `useLocation().state` */
export type LectureReportSubmitCompleteLocationState = {
  lectureReportSubmitComplete?: true
  /** 정산 작성 화면 `sessionId` — 강의 일정 ID 문자열 */
  settlementSessionId?: string
}

export function readLectureReportSubmitCompleteState(
  state: unknown,
): LectureReportSubmitCompleteLocationState | null {
  if (!state || typeof state !== 'object') return null
  const value = state as LectureReportSubmitCompleteLocationState
  if (value.lectureReportSubmitComplete !== true) return null
  return value
}
