/**
 * 인재채용 관리 — Platform 인재 지원 폼 필드
 * status: pending 확인 대기 / confirmed 확인 완료
 */

export type RecruitApplicantStatus = 'pending' | 'confirmed'

export type RecruitJobInterest =
  | 'managementPlanning'
  | 'prDesign'
  | 'accounting'
  | 'hrAdmin'
  | 'educationOps'
  | 'other'

export type RecruitCareerType = 'newbie' | 'experienced'

export type RecruitApplicant = {
  id: string
  status: RecruitApplicantStatus
  jobInterest: RecruitJobInterest
  applicantName: string
  phone: string
  email: string
  careerType: RecruitCareerType
  appliedAt: string
  confirmedAt: string | null
  version: number
}

export type RecruitApplicantListFilter = {
  status?: RecruitApplicantStatus
  jobInterest?: RecruitJobInterest
  applicantName?: string
  phone?: string
  email?: string
  careerType?: RecruitCareerType
  appliedFrom?: string
  appliedTo?: string
  confirmedFrom?: string
  confirmedTo?: string
}
