import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'

function resolveMergedInterviewAssignmentId(
  server: GeneralVolunteerApplicantRow,
  local: GeneralVolunteerApplicantRow
): number | undefined {
  if (server.interviewAssignmentId != null) {
    return server.interviewAssignmentId
  }
  if (local.interviewAssignmentId == null) {
    return undefined
  }
  if (server.interviewAssignmentStatus === 'assigned') {
    return local.interviewAssignmentId
  }
  return undefined
}

/**
 * 서버 목록 refetch 후 배정 직후 `interviewAssignmentId`를 보강한다.
 * 서버에 ID가 있으면 서버 우선. 서버가 배정 해제·포기 상태면 로컬 ID를 되살리지 않는다.
 */
export function mergeGeneralVolunteerApplicantListRows(
  previous: GeneralVolunteerApplicantRow[],
  next: GeneralVolunteerApplicantRow[]
): GeneralVolunteerApplicantRow[] {
  if (previous.length === 0) return next
  const previousById = new Map(previous.map(row => [row.id, row]))
  return next.map(row => {
    const local = previousById.get(row.id)
    if (!local) return row
    const interviewAssignmentId = resolveMergedInterviewAssignmentId(row, local)
    if (interviewAssignmentId === row.interviewAssignmentId) {
      return row
    }
    return { ...row, interviewAssignmentId }
  })
}
