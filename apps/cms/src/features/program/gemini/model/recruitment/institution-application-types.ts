import type { GeminiApprovedTrainingStatus } from '../approved/types'

export type GeminiInstitutionApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type GeminiInstitutionApplicationRow = {
  id: string
  no: number
  institutionName: string
  institutionSido: string
  institutionSigungu: string
  approvalStatus: GeminiInstitutionApprovalStatus
  preferredLectureSchedule: string
  studentCount: number
  teacherName: string
  programProgressStatus?: GeminiApprovedTrainingStatus
}

/** @deprecated remote-only — 로컬 patch no-op */
export function patchGeminiInstitutionApplicationApprovalStatus(
  _ids: string[],
  _status: GeminiInstitutionApprovalStatus
): void {
  void _ids
  void _status
}

/** @deprecated remote-only */
export function getApprovedInstitutionProgressStatuses(
  _recruitmentId: string
): GeminiApprovedTrainingStatus[] {
  void _recruitmentId
  return []
}
