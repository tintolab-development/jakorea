/**
 * 재능기부 신청 관리 도메인
 * - pending: 확인 대기 / confirmed: 확인 완료
 */

export type ApplicationStatus = 'pending' | 'confirmed'

export type ApplicantGender = 'male' | 'female'

export type TalentDonationApplication = {
  id: string
  status: ApplicationStatus
  applicantName: string
  gender: ApplicantGender
  /** ISO date YYYY-MM-DD */
  birthDate: string
  /** 원문 연락처 (목록 마스킹, 상세 전체) */
  phone: string
  email: string
  affiliation: string
  homeAddress: string
  /** 재능 기부 가능 시작일 ISO date */
  availableFrom: string
  /** 재능 기부 가능 종료일 ISO date */
  availableTo: string
  bio: string
  talentIntro: string
  motivation: string
  jaProgramHistory: boolean
  attachmentFileName: string | null
  attachmentUrl: string | null
  privacyConsent: true
  appliedAt: string
  confirmedAt: string | null
  confirmedByName: string | null
  version: number
}

export type JaProgramHistoryFilter = 'yes' | 'no'

export type TalentDonationApplicationListFilter = {
  status?: ApplicationStatus
  applicantName?: string
  phone?: string
  email?: string
  jaProgramHistory?: JaProgramHistoryFilter
  appliedFrom?: string
  appliedTo?: string
  confirmedFrom?: string
  confirmedTo?: string
}

export type TalentDonationApplicationListResult = {
  items: TalentDonationApplication[]
  totalCount: number
}

export type TalentDonationApplicationPrivacyLog = {
  id: string
  applicationId: string
  purpose: string
  viewedAt: string
  actorName: string
}
