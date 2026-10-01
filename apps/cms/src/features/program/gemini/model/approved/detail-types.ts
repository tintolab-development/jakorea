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
  /** 모집 공고 programId — ProgramManagersTab 전용 */
  programId: string
  recruitmentTitle: string
  institutionName: string
  trainingDate: string
  trainingTimeText: string
  studentCount: number | null
  recruitmentCount: number | null
  completedRecruitmentCount: number | null
  institutionAddress: string
  joinedAt: string
  managerMemberId?: string
  managerNameKo: string
  managerScheduleChangeCount: number
  managerGender: string
  managerBirthDate: string
  /** null이면 재직 배지/ ACTIVE 강제 금지 */
  managerEmploymentStatus: GeminiApprovedTrainingEmploymentStatus | null
  managerContact: string
  managerEmail: string
  managerSchool: string
  managerHomeAddress: string
  managerLectureExperience: string
  managerAccountBank: string
  managerAccountNumber: string
  managerAccountHolder: string
  managerInstructorFeeGrade: string
  managerBusinessIncomeLabel: string
  managerOneLineIntro: string
  managerPosition: string
  managerSubject: string
  instructor: GeminiApprovedTrainingInstructorInfo
  officialDocumentType: string
  officialDocumentRequiredInfo: string
  trainingContent: string
  instructorAssigned: boolean
  lastPreferredDate: string
  officialDocumentRequired: boolean
  /** 서버 progressStatus. 없으면 UI가 날짜로 파생 */
  progressStatus: GeminiApprovedTrainingStatus | null
}
