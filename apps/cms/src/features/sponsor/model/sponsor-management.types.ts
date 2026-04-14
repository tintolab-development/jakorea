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

export type SponsorProgramParticipantType = 'school' | 'individual' | 'volunteer'
export type SponsorProgramEducationTarget =
  | 'elementary'
  | 'middle'
  | 'high'
  | 'college'
  | 'adult'

export type SponsorProgramHistoryRow = {
  id: string
  title: string
  year: number
  lifecycleStatus: ProgramLifecycleStatus
  managerName: string
  participantCount: string
  participantType: SponsorProgramParticipantType
  educationTarget: SponsorProgramEducationTarget
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
