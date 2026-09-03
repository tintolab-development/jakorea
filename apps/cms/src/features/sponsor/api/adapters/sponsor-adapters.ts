import type {
  SponsorContactRow,
  SponsorLogoFile,
  SponsorManagementDetailView,
  SponsorManagementRow,
  SponsorProgramHistoryRow,
  SponsorRegisterPayload,
  SponsorYearlyBusinessRow,
} from '@/features/sponsor/model/sponsor-management.types'
import type { BasicInfoEditState } from '@/features/sponsor/ui/sponsor-detail-basic-info'
import type {
  SponsorContactRequest,
  SponsorContactResponse,
  SponsorDetailResponse,
  SponsorProgramHistoryResponse,
  SponsorRequest,
  SponsorResponse,
  SponsorYearlyBusinessRequest,
  SponsorYearlyBusinessResponse,
} from '@/shared/api/generated/data-management/schemas'
import type {
  SponsorOrganizationKind,
  SponsorSponsorshipStatus,
} from '@/types/domain'
import type { DateValue } from '@/types'
import type { SponsorContactRegisterPayload } from '@/features/sponsor/ui/modal/sponsor-contact-register-modal'

function parseOrganizationKind(value: string | undefined): SponsorOrganizationKind {
  return value === 'foundation' ? 'foundation' : 'corporate'
}

function parseSponsorshipStatus(value: string | undefined): SponsorSponsorshipStatus {
  if (value === 'ended' || value === 'discussing' || value === 'dormant') return value
  return 'active'
}

export function mapSponsorResponse(dto: SponsorResponse): SponsorManagementRow {
  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    nameEn: dto.nameEn,
    description: dto.description,
    contactInfo: dto.contactInfo,
    managers: (dto.managers ?? []).map(m => ({
      name: m.name ?? '',
      phone: m.phone ?? '',
    })),
    securityMemo: dto.securityMemo,
    createdAt: dto.createdAt ?? '',
    updatedAt: dto.updatedAt ?? '',
    organizationKind: parseOrganizationKind(dto.organizationKind),
    sponsorshipStatus: parseSponsorshipStatus(dto.sponsorshipStatus),
    sponsorshipStartDate: dto.sponsorshipStartDate,
    programCount: Number(dto.programCount ?? 0),
    totalDonationAmount: Number(dto.totalDonationAmount ?? 0),
    totalBeneficiaryCount: Number(dto.totalBeneficiaryCount ?? 0),
  }
}

const LEAD_CONTACT_TYPE_VALUES = new Set([
  'lead',
  'primary',
  'main',
  '주담당자',
  '주 담당자',
])

const ASSISTANT_CONTACT_TYPE_VALUES = new Set([
  'assistant',
  'secondary',
  'sub',
  '담당자',
  '부담당자',
  '부 담당자',
])

export function parseSponsorContactType(
  dto: Pick<SponsorContactResponse, 'contactType' | 'primary'>
): SponsorContactRow['contactType'] {
  const raw = dto.contactType?.trim().toLowerCase() ?? ''
  if (LEAD_CONTACT_TYPE_VALUES.has(raw)) return 'lead'
  if (ASSISTANT_CONTACT_TYPE_VALUES.has(raw)) return 'assistant'
  if (dto.primary === true) return 'lead'
  if (dto.primary === false) return 'assistant'
  return 'assistant'
}

export function mapSponsorContactResponse(dto: SponsorContactResponse): SponsorContactRow {
  const contactType = parseSponsorContactType(dto)
  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    department: dto.department ?? '',
    position: dto.position ?? '',
    officePhone: dto.officePhone ?? '',
    phone: dto.phone ?? dto.mobilePhone ?? '',
    email: dto.email ?? '',
    companyAddress: dto.companyAddress ?? '',
    memo: dto.memo ?? '',
    registeredAt: dto.registeredAt ?? dto.createdAt ?? '',
    contactType,
  }
}

export function mapProgramHistoryResponse(
  dto: SponsorProgramHistoryResponse
): SponsorProgramHistoryRow {
  return {
    id: dto.id ?? '',
    programId: dto.programId ?? '',
    title: dto.title ?? '',
    year: dto.year ?? 0,
    lifecycleStatus: (dto.lifecycleStatus ?? 'planned') as SponsorProgramHistoryRow['lifecycleStatus'],
    managerName: dto.managerName ?? '',
    participantCount: dto.participantCount ?? '',
    participantType: parseParticipantType(dto.participantType),
    educationTarget: (dto.educationTarget ?? 'elementary') as SponsorProgramHistoryRow['educationTarget'],
  }
}

function parseParticipantType(
  raw: string | undefined | null
): SponsorProgramHistoryRow['participantType'] {
  if (raw === 'individual' || raw === 'volunteer' || raw === 'school') return raw
  return 'school'
}

export function mapYearlyBusinessResponse(
  dto: SponsorYearlyBusinessResponse
): SponsorYearlyBusinessRow {
  return {
    id: dto.id ?? '',
    year: dto.businessYear ?? 0,
    donationAmount: dto.donationAmount ?? 0,
    beneficiaryCount: dto.beneficiaryCount ?? 0,
    memo: dto.memo ?? '',
    businessName: dto.businessName ?? '',
    managerNameSnapshot: dto.managerNameSnapshot ?? '',
  }
}

export function emptyYearlyBusinessRow(year: number): SponsorYearlyBusinessRow {
  return {
    id: '',
    year,
    donationAmount: 0,
    beneficiaryCount: 0,
    memo: '',
    businessName: '',
    managerNameSnapshot: '',
  }
}

/** 기존 행이거나 후원금·수혜자·비고가 있으면 저장. 빈 플레이스홀더 연도는 POST하지 않음 */
export function shouldPersistYearlyBusinessRow(row: SponsorYearlyBusinessRow): boolean {
  if (row.id.trim()) return true
  return row.donationAmount > 0 || row.beneficiaryCount > 0 || row.memo.trim().length > 0
}

export function toYearlyBusinessRequest(row: SponsorYearlyBusinessRow): SponsorYearlyBusinessRequest {
  const body: SponsorYearlyBusinessRequest = {
    businessYear: row.year,
    businessName: row.businessName.trim() || `${row.year}년`,
    donationAmount: row.donationAmount,
    beneficiaryCount: row.beneficiaryCount,
    memo: row.memo,
  }
  if (row.managerNameSnapshot.trim()) {
    body.managerNameSnapshot = row.managerNameSnapshot.trim()
  }
  return body
}

function parseYearFromDate(value: DateValue | undefined): number | undefined {
  if (value == null) return undefined
  const raw = value instanceof Date ? String(value.getFullYear()) : String(value)
  const year = Number(raw.slice(0, 4))
  return Number.isInteger(year) && year >= 1990 && year <= 2100 ? year : undefined
}

/** 후원 시작연도~올해 빈 연도를 채워 상세 테이블에 표시 */
export function mergeYearlyBusinessRows(
  apiRows: SponsorYearlyBusinessRow[],
  sponsorshipStartDate: DateValue | undefined,
  now = new Date()
): SponsorYearlyBusinessRow[] {
  const currentYear = now.getFullYear()
  const apiYears = apiRows.map(row => row.year).filter(year => year > 0)
  const startYear =
    parseYearFromDate(sponsorshipStartDate) ??
    (apiYears.length > 0 ? Math.min(...apiYears) : currentYear)
  const from = Math.min(startYear, currentYear)
  const byYear = new Map(apiRows.filter(row => row.year > 0).map(row => [row.year, row]))
  const rows: SponsorYearlyBusinessRow[] = []
  for (let year = from; year <= currentYear; year += 1) {
    rows.push(byYear.get(year) ?? emptyYearlyBusinessRow(year))
    byYear.delete(year)
  }
  for (const leftover of byYear.values()) rows.push(leftover)
  rows.sort((a, b) => b.year - a.year)
  return rows
}

function mapSponsorLogos(dto: Pick<SponsorDetailResponse, 'logoFileId'>): SponsorLogoFile[] {
  const id = dto.logoFileId?.trim()
  if (!id) return []
  return [{ id, fileName: id.includes('.') ? id : '후원사 로고' }]
}

export function mapSponsorDetailResponse(dto: SponsorDetailResponse): SponsorManagementDetailView {
  const base = mapSponsorResponse(dto)
  return {
    ...base,
    nameDisplayKo: dto.nameDisplayKo ?? base.name,
    nameDisplayEn: dto.nameDisplayEn ?? base.nameEn ?? '',
    businessNumber: dto.businessNumber ?? '',
    executives: dto.executives ?? '',
    address: dto.address ?? '',
    homepageUrl: dto.homepageUrl ?? '',
    logos: mapSponsorLogos(dto),
    contacts: (dto.contacts ?? []).map(mapSponsorContactResponse),
    programHistories: (dto.programHistories ?? []).map(mapProgramHistoryResponse),
    yearlyBusinesses: mergeYearlyBusinessRows(
      (dto.yearlyBusinesses ?? []).map(mapYearlyBusinessResponse),
      base.sponsorshipStartDate
    ),
  }
}

/** OpenAPI `SponsorRequest` + 응답에만 있는 홈페이지·로고 id (BE 수용 시 저장) */
export type SponsorWriteRequest = SponsorRequest & {
  homepageUrl?: string
  logoFileId?: string
}

export function toSponsorRequestFromRegister(payload: SponsorRegisterPayload): SponsorWriteRequest {
  const name = payload.nameDisplayKo.trim()
  const nameEn = payload.nameDisplayEn.trim()
  const address = [payload.district.trim(), payload.detailAddress.trim()].filter(Boolean).join(' ')
  const homepageUrl = payload.homepageUrl.trim()
  const securityMemo = payload.securityMemo.trim()
  return {
    name,
    nameEn: nameEn || undefined,
    nameDisplayKo: name,
    nameDisplayEn: nameEn || undefined,
    businessNumber: payload.businessNumber.trim() || undefined,
    executives: payload.executives.trim() || undefined,
    address: address || undefined,
    organizationKind: payload.organizationKind,
    sponsorshipStatus: payload.sponsorshipStatus,
    sponsorshipStartDate: payload.sponsorshipStartDate,
    securityMemo: securityMemo || undefined,
    homepageUrl: homepageUrl || undefined,
  }
}

export function toSponsorRequestFromBasicInfo(
  basicInfo: BasicInfoEditState,
  existing: SponsorManagementDetailView
): SponsorWriteRequest {
  const address = [basicInfo.district.trim(), basicInfo.detailAddress.trim()]
    .filter(Boolean)
    .join(' ')
  return {
    name: basicInfo.nameDisplayKo.trim() || existing.name,
    nameEn: basicInfo.nameDisplayEn.trim() || existing.nameEn,
    nameDisplayKo: basicInfo.nameDisplayKo.trim() || existing.nameDisplayKo,
    nameDisplayEn: basicInfo.nameDisplayEn.trim() || existing.nameDisplayEn,
    businessNumber: basicInfo.businessNumber.trim() || existing.businessNumber,
    executives: basicInfo.executives.trim() || existing.executives,
    address: address || existing.address,
    description: existing.description,
    organizationKind: basicInfo.organizationKind,
    sponsorshipStatus: basicInfo.sponsorshipStatus,
    sponsorshipStartDate:
      basicInfo.sponsorshipStartDate != null
        ? String(basicInfo.sponsorshipStartDate)
        : existing.sponsorshipStartDate != null
          ? String(existing.sponsorshipStartDate)
          : undefined,
    managers: existing.managers,
    contactInfo: existing.contactInfo,
    securityMemo: basicInfo.securityMemo.trim() || existing.securityMemo,
    homepageUrl: basicInfo.homepageUrl.trim() || undefined,
  }
}

export function toSponsorContactRequest(
  payload: SponsorContactRegisterPayload,
  contactType: SponsorContactRow['contactType']
): SponsorContactRequest {
  return {
    name: payload.name.trim(),
    department: payload.department.trim(),
    position: payload.position.trim(),
    officePhone: payload.officePhone.trim(),
    mobilePhone: payload.phone.trim(),
    email: payload.email.trim(),
    companyAddress: payload.companyAddress.trim(),
    memo: payload.memo.trim(),
    primary: contactType === 'lead',
    contactType,
  }
}

export function toSponsorContactUpdateRequest(
  row: SponsorContactRow
): SponsorContactRequest {
  return {
    name: row.name,
    department: row.department,
    position: row.position,
    officePhone: row.officePhone,
    mobilePhone: row.phone,
    email: row.email,
    companyAddress: row.companyAddress,
    memo: row.memo,
    primary: row.contactType === 'lead',
    contactType: row.contactType,
  }
}
