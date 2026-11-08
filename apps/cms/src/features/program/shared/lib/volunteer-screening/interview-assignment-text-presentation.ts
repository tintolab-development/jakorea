/** 일반·UJAT 면접배정 Text가 기존에 공유하던 3상태 색. 업무별 라벨/추가 enum은 각 도메인에 둔다. */
export type InterviewAssignmentTextState = 'waiting' | 'assigned' | 'withdrawn'
const INTERVIEW_ASSIGNMENT_TEXT_ACCENT: Record<InterviewAssignmentTextState, string> = {
  waiting: 'var(--Status-green-main, #1e8c29)',
  assigned: 'var(--Netural-black, #3d3d3d)',
  withdrawn: 'var(--Status-red-main, #c32f4a)',
}
export function getInterviewAssignmentTextAccent(status: InterviewAssignmentTextState): string {
  return INTERVIEW_ASSIGNMENT_TEXT_ACCENT[status]
}
