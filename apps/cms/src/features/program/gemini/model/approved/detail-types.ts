import type { GeminiApprovedTrainingStatus } from './types'

export type GeminiApprovedTrainingEmploymentStatus = 'ACTIVE' | 'LEAVE' | 'TRANSFER'

export type GeminiApprovedTrainingInstructorInfo = {
  name: string
  region: string
  experienceYears: number
  grade: string
  contact: string
  email: string
}

export type GeminiApprovedTrainingDetail = {
  id: string
  institutionName: string
  status: GeminiApprovedTrainingStatus
  trainingDate: string
  trainingTimeText: string
  studentCount: number
  recruitmentCount: number
  completedRecruitmentCount: number
  institutionAddress: string
  joinedAt: string
  managerNameKo: string
  managerScheduleChangeCount: number
  managerGender: string
  managerBirthDate: string
  managerEmploymentStatus: GeminiApprovedTrainingEmploymentStatus
  managerContact: string
  managerEmail: string
  managerSchool: string
  managerPosition: string
  managerSubject: string
  instructor: GeminiApprovedTrainingInstructorInfo
  officialDocumentType: string
  officialDocumentRequiredInfo: string
}
