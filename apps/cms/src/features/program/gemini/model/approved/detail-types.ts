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
  recruitmentTitle: string
  institutionName: string
  trainingDate: string
  trainingTimeText: string
  studentCount: number
  recruitmentCount: number
  completedRecruitmentCount: number
  institutionAddress: string
  joinedAt: string
  managerMemberId?: string
  managerNameKo: string
  managerScheduleChangeCount: number
  managerGender: string
  managerBirthDate: string
  managerEmploymentStatus: GeminiApprovedTrainingEmploymentStatus
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
}
