function positiveId(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null
}

export function resolveInstructorLectureApplicationId(input: {
  routeApplicationId: string
  instructorApplicationId?: number | null
}): string {
  const fromAssignment = positiveId(input.instructorApplicationId)
  if (fromAssignment != null) return String(fromAssignment)
  return input.routeApplicationId.trim()
}

export function resolveLectureSettlementSessionId(input: {
  scheduleId?: number | null
  assignmentId?: number | null
}): string {
  const scheduleId = positiveId(input.scheduleId)
  if (scheduleId != null) return String(scheduleId)
  const assignmentId = positiveId(input.assignmentId)
  if (assignmentId != null) return String(assignmentId)
  return ''
}

export function lectureReportCompleteTabPath(applicationId: string): string {
  return `/mypage/lectures/INSTRUCTOR/${encodeURIComponent(applicationId)}?section=lecture-report`
}

export function lectureReportCompleteSettlementWritePath(
  applicationId: string,
  sessionId: string,
): string | null {
  const appId = applicationId.trim()
  const session = sessionId.trim()
  if (!appId || !session) return null
  const params = new URLSearchParams({ sessionId: session })
  return `/mypage/lectures/INSTRUCTOR/${encodeURIComponent(appId)}/settlement/write?${params.toString()}`
}
