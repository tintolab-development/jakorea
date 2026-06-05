import type { GeminiApprovedTrainingStatus } from './types'

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
  connectedSocialAccount: string
  managerNameKo: string
  managerNameEn: string
  managerBirthDate: string
  managerContact: string
  managerEmail: string
  managerHomeAddress: string
  managerSchool: string
  managerGrade: string
  managerPosition: string
  managerSubject: string
  instructor: GeminiApprovedTrainingInstructorInfo
  officialDocumentType: string
  officialDocumentRequiredInfo: string
}
