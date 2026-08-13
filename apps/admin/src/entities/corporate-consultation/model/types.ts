/**
 * 기업 후원 상담 신청 도메인
 * - pending: 확인 대기 / confirmed: 확인 완료
 */

export type ConsultationStatus = 'pending' | 'confirmed'

export type CorporateConsultation = {
  id: string
  status: ConsultationStatus
  companyName: string
  contactName: string
  /** 부서/직함 */
  departmentTitle: string
  /** 원문 연락처 (목록 마스킹, 상세 전체) */
  phone: string
  /** 신청 시 동의 전제 */
  privacyConsent: true
  /** 상담 내용 */
  content: string
  linkUrl: string | null
  attachmentFileName: string | null
  attachmentUrl: string | null
  /** 신청 접수 ISO */
  appliedAt: string
  confirmedAt: string | null
  confirmedByName: string | null
  version: number
}

export type CorporateConsultationListFilter = {
  status?: ConsultationStatus
  companyName?: string
  contactName?: string
  departmentTitle?: string
  appliedFrom?: string
  appliedTo?: string
  confirmedFrom?: string
  confirmedTo?: string
}

export type CorporateConsultationListResult = {
  items: CorporateConsultation[]
  totalCount: number
}

/** 개인정보 조회 감사( mock ) */
export type CorporateConsultationPrivacyLog = {
  id: string
  consultationId: string
  purpose: string
  viewedAt: string
  actorName: string
}
