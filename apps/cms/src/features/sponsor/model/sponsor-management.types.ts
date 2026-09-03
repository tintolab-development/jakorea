import type {
  ProgramLifecycleStatus,
  Sponsor,
  SponsorOrganizationKind,
  SponsorSponsorshipStatus,
} from '@/types/domain'
import type { Dayjs } from 'dayjs'

export type SponsorManagementRow = Sponsor & {
  programCount: number
  /** 연도별 후원금 합 — 목록 DTO `totalDonationAmount` */
  totalDonationAmount: number
  /** 연도별 수혜자 합 — 목록 DTO `totalBeneficiaryCount` */
  totalBeneficiaryCount: number
}

/** 후원사 신규 등록 — 목록 행이 아니라 POST body 원본 */
export type SponsorRegisterPayload = {
  nameDisplayKo: string
  nameDisplayEn: string
  organizationKind: SponsorOrganizationKind
  businessNumber: string
  sponsorshipStartDate: string
  sponsorshipStatus: SponsorSponsorshipStatus
  executives: string
  district: string
  detailAddress: string
  homepageUrl: string
  securityMemo: string
  /**
   * 로고 로컬 파일. `SponsorRequest`에 `logoFileId`가 없어 전송하지 않음.
   * BE가 업로드·id를 받으면 create 경로에 연결한다.
   */
  logoFile: File | null
}

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

export type SponsorLogoFile = {
  id: string
  fileName: string
}

export type SponsorManagementDetailView = SponsorManagementRow & {
  nameDisplayKo: string
  nameDisplayEn: string
  businessNumber: string
  executives: string
  address: string
  homepageUrl: string
  logos: SponsorLogoFile[]
  contacts: SponsorContactRow[]
  programHistories: SponsorProgramHistoryRow[]
  yearlyBusinesses: SponsorYearlyBusinessRow[]
}
