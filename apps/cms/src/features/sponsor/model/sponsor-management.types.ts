import type {
  ProgramLifecycleStatus,
  Sponsor,
  SponsorOrganizationKind,
  SponsorSponsorshipStatus,
} from '@/types/domain'

export type SponsorManagementRow = Sponsor & { programCount: number }

export type SponsorManagementTableContext = Record<string, never>

export type SponsorManagementPendingFilters = {
  organizationKind: 'ALL' | SponsorOrganizationKind
  sponsorName: string
  managerName: string
  sponsorshipStatus: 'ALL' | SponsorSponsorshipStatus
}

export type SponsorContactType = 'lead' | 'assistant'

export type SponsorContactRow = {
  id: string
  name: string
  position: string
  phone: string
  email: string
  registeredAt: string
  contactType: SponsorContactType
}

/** 후원사 상세 > 프로그램 진행 이력: 학교/기관·개인 학습자만 (봉사자 구분 없음) */
export type SponsorProgramParticipantType = 'school' | 'individual'
export type SponsorProgramEducationTarget =
  | 'elementary'
  | 'middle'
  | 'high'
  | 'college'
  | 'adult'

export type SponsorProgramHistoryRow = {
  id: string
  /** CMS 프로그램 상세(목록 경로 + programId 쿼리) 이동용 */
  programId: string
  title: string
  year: number
  lifecycleStatus: ProgramLifecycleStatus
  managerName: string
  participantCount: string
  participantType: SponsorProgramParticipantType
  educationTarget: SponsorProgramEducationTarget
}

export type SponsorProgramHistoryFilters = {
  title: string
  year: string
  lifecycleStatus: string
  educationTarget: string
  managerName: string
}

/** 후원사 상세 풀페이지용 — 목록 행 + 표시 전용 확장 필드 */
export type SponsorManagementDetailView = SponsorManagementRow & {
  nameDisplayKo: string
  nameDisplayEn: string
  businessNumber: string
  executives: string
  address: string
  contacts: SponsorContactRow[]
  programHistories: SponsorProgramHistoryRow[]
}
