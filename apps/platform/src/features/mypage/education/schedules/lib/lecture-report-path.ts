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
  return `/mypage/lectures/INSTRUCTOR/${encodeURIComponent(applicationId)}?section=lecture-report`
}
