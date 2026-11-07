export type GeminiInstructorApplicationApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'UNKNOWN'

export type GeminiInstructorApplicationRow = {
  id: string
  approvedTrainingId: string
  no: number
  instructorName: string
  homeSido: string
  homeSigungu: string
  experienceYears: number | null
  grade: string
  contact: string
  email: string
  monthlyAssignmentCount: number
  approvalStatus: GeminiInstructorApplicationApprovalStatus
  availableActions: string[]
}
