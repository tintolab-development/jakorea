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

export type RecruitEducationLevel =
  | 'highSchool'
  | 'college'
  | 'university'
  | 'master'
  | 'doctor'
  | 'other'

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

/** 상세 모달. 목록 item에 없는 주소·학력·경력·동의·첨부는 상세 GET으로만 채운다. */
export type RecruitApplicantDetail = RecruitApplicant & {
  addressRoad: string
  addressDetail: string
  educationLevel: RecruitEducationLevel | null
  schoolName: string
  major: string
  educationInfo: string
  careerInfo: string
  privacyAgreed: boolean
  attachmentFileName: string | null
  attachmentAssetId?: number | null
  confirmedByName: string | null
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

export type RecruitApplicantListResult = {
  items: RecruitApplicant[]
  totalCount: number
}
