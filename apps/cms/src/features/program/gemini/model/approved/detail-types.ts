import type { GeminiApprovedTrainingDateCandidate, GeminiApprovedTrainingStatus } from './types'

export type GeminiApprovedTrainingEmploymentStatus = 'ACTIVE' | 'LEAVE' | 'TRANSFER'

export type GeminiApprovedTrainingInstructorInfo = {
  memberId?: string
  name: string
  region: string
  /** null이면 0으로 바꾸지 않는다 */
  experienceYears: number | null
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
  /** 기관 신청 희망 일정(1~3지망). 확정 일정이 없을 때 표시용 */
  trainingDateCandidates: GeminiApprovedTrainingDateCandidate[]
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
