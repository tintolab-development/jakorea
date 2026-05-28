export type GeminiInstructorApplicationApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type GeminiInstructorApplicationRow = {
  id: string
  approvedTrainingId: string
  no: number
  instructorName: string
  homeSido: string
  homeSigungu: string
  experienceYears: number
  grade: string
  contact: string
  email: string
  monthlyAssignmentCount: number
  approvalStatus: GeminiInstructorApplicationApprovalStatus
}
