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
  /** 원문 성별. 없거나 마스킹 응답이면 null — 다른 값으로 추정하지 않는다. */
  gender: ApplicantGender | null
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
  attachmentAssetId?: number | null
  attachmentUrl: string | null
  privacyConsent: true
  appliedAt: string
  confirmedAt: string | null
  confirmedByName: string | null
  version: number
  /**
   * 상세 GET이 마스킹 응답인지(HOMEPAGE_PII_VIEW 없음 — Program Viewer).
   * true면 gender·birthDate는 원문이 아니므로 표시에 쓰지 않고 masked* 값을 그대로 보여준다.
   */
  piiMasked?: boolean
  /** 서버 마스킹 생년월일(예: 2000.**.**). piiMasked=false면 null */
  maskedBirthDate?: string | null
  /** 서버 마스킹 성별(예: **). piiMasked=false면 null */
  maskedGender?: string | null
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
