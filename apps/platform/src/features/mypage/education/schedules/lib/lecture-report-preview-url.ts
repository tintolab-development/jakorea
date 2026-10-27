/** 강의보고서 확인(미리보기) 풀페이지 모달 — `?lectureReportPreviewAssignmentId=` */
export const LECTURE_REPORT_PREVIEW_ASSIGNMENT_QUERY_KEY = 'lectureReportPreviewAssignmentId'

export function parseLectureReportPreviewAssignmentId(value: string | null): number | null {
  if (!value || !/^\d+$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null
}

export function readLectureReportPreviewAssignmentIdFromLocation(): number | null {
  if (typeof window === 'undefined') return null
  return parseLectureReportPreviewAssignmentId(
    new URLSearchParams(window.location.search).get(LECTURE_REPORT_PREVIEW_ASSIGNMENT_QUERY_KEY),
  )
}

function buildLocationWithPreviewAssignmentId(assignmentId: number | null): string {
  const params = new URLSearchParams(window.location.search)
  if (assignmentId != null) {
    params.set(LECTURE_REPORT_PREVIEW_ASSIGNMENT_QUERY_KEY, String(assignmentId))
  } else {
    params.delete(LECTURE_REPORT_PREVIEW_ASSIGNMENT_QUERY_KEY)
  }
  const search = params.toString()
  return `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
}

export function writeLectureReportPreviewAssignmentIdToLocation(
  assignmentId: number | null,
  mode: 'push' | 'replace',
) {
  if (typeof window === 'undefined') return
  const next = buildLocationWithPreviewAssignmentId(assignmentId)
  if (mode === 'push') {
    window.history.pushState(null, '', next)
    return
  }
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (next !== current) window.history.replaceState(null, '', next)
}
