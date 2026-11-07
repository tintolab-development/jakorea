import type { SchoolTeacherEmploymentStatus } from '@/types/user'
import type { GeminiApprovedTrainingEmploymentStatus } from '../../model/approved/detail-types'

export function mapGeminiApprovedEmploymentToSchoolStatus(
  status: GeminiApprovedTrainingEmploymentStatus
): SchoolTeacherEmploymentStatus {
  if (status === 'LEAVE') return 'ON_LEAVE'
  if (status === 'TRANSFER') return 'TRANSFERRED'
  return 'ACTIVE'
}
