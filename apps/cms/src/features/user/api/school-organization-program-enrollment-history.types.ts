import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'

/** Handoff: GET .../organizations/schools/{organizationId}/program-enrollment-history item */
export interface SchoolOrganizationProgramEnrollmentHistoryItemResponse {
  historyRowId: number
  organizationApplicationId?: number
  programId: number
  programName: string
  progressYear: number
  enrollmentDisplayStatus: ProgramEnrollmentDisplayStatus | string
  businessArea?: string
  educationGrade?: string
  managerName?: string
  deletable?: boolean
  submittedAt?: string
}

export interface PageResponseSchoolOrganizationProgramEnrollmentHistoryItemResponse {
  items?: SchoolOrganizationProgramEnrollmentHistoryItemResponse[]
  page?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export interface ListSchoolOrganizationProgramEnrollmentHistoryParams {
  page?: number
  size?: number
  title?: string
  year?: number
  enrollmentStatus?: string
  managerName?: string
}

export interface SchoolOrganizationProgramEnrollmentHistoryBulkDeleteRequest {
  historyRowIds: number[]
}

export interface BulkActionResponse {
  successCount?: number
  failureCount?: number
}
