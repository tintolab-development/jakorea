import type { PreferredScheduleBlock } from '@/shared/api/generated/dashboard/schemas/preferredScheduleBlock'
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
  preferredScheduleBlocks: PreferredScheduleBlock[]
  studentCount: number
  teacherName: string
  programProgressStatus?: GeminiApprovedTrainingStatus
  /** BE resultNotificationSentAt — 표시용 ISO 또는 포맷 문자열 */
  resultNotificationSentAt?: string | null
  availableActions?: string[]
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
