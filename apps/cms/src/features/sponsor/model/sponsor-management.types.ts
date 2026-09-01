import type {
  ProgramLifecycleStatus,
  Sponsor,
  SponsorOrganizationKind,
  SponsorSponsorshipStatus,
} from '@/types/domain'
import type { Dayjs } from 'dayjs'

export type SponsorManagementRow = Sponsor & { programCount: number }

export type SponsorManagementTableContext = Record<string, never>

/** 후원 시작일 기간 필터 (TableFilterGroup dateRange) */
export type SponsorManagementDateRange =
  | [Dayjs, Dayjs]
  | [Dayjs | null, Dayjs | null]
  | null

export type SponsorManagementPendingFilters = {
  /** 전체 없음 — 기업/재단 라디오만 */
  organizationKind: SponsorOrganizationKind
  sponsorName: string
  managerName: string
  sponsorshipStatus: 'ALL' | SponsorSponsorshipStatus
  sponsorshipStartDateRange: SponsorManagementDateRange
}

export type SponsorContactType = 'lead' | 'assistant'

export type SponsorContactRow = {
  id: string
  name: string
  department: string
  position: string
  /** 내선번호 */
  officePhone: string
  /** 휴대폰 연락처 */
  phone: string
  email: string
  companyAddress: string
  memo: string
  registeredAt: string
  contactType: SponsorContactType
}

/** 후원사 상세 > 프로그램 진행 이력 */
export type SponsorProgramParticipantType = 'school' | 'individual' | 'volunteer'
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
  participantType: string
  educationTarget: string
  managerName: string
}

/** 후원사 상세 풀페이지용 — 목록 행 + 표시 전용 확장 필드 */
export type SponsorYearlyBusinessRow = {
  id: string
  year: number
  donationAmount: number
  beneficiaryCount: number
  memo: string
  /** API 필수. UI에는 없음 — GET 값 유지, 신규는 `${year}년` */
  businessName: string
  managerNameSnapshot: string
}

export type SponsorManagementDetailView = SponsorManagementRow & {
  nameDisplayKo: string
  nameDisplayEn: string
  businessNumber: string
  executives: string
  address: string
  contacts: SponsorContactRow[]
  programHistories: SponsorProgramHistoryRow[]
  yearlyBusinesses: SponsorYearlyBusinessRow[]
}
