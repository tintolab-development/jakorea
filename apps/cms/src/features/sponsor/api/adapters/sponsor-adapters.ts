import type {
  SponsorContactRow,
  SponsorManagementDetailView,
  SponsorManagementRow,
  SponsorProgramHistoryRow,
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
  return value === 'ended' ? 'ended' : 'active'
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
  }
}

export function mapSponsorContactResponse(dto: SponsorContactResponse): SponsorContactRow {
  const contactType = dto.contactType === 'lead' || dto.primary ? 'lead' : 'assistant'
  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    position: dto.position ?? '',
    phone: dto.phone ?? dto.mobilePhone ?? dto.officePhone ?? '',
    email: dto.email ?? '',
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
    participantType: (dto.participantType ?? 'school') as SponsorProgramHistoryRow['participantType'],
    educationTarget: (dto.educationTarget ?? 'elementary') as SponsorProgramHistoryRow['educationTarget'],
  }
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

export function mapSponsorDetailResponse(dto: SponsorDetailResponse): SponsorManagementDetailView {
  const base = mapSponsorResponse(dto)
  return {
    ...base,
    nameDisplayKo: dto.nameDisplayKo ?? base.name,
    nameDisplayEn: dto.nameDisplayEn ?? base.nameEn ?? '',
    businessNumber: dto.businessNumber ?? '',
    executives: dto.executives ?? '',
    address: dto.address ?? '',
    contacts: (dto.contacts ?? []).map(mapSponsorContactResponse),
    programHistories: (dto.programHistories ?? []).map(mapProgramHistoryResponse),
    yearlyBusinesses: mergeYearlyBusinessRows(
      (dto.yearlyBusinesses ?? []).map(mapYearlyBusinessResponse),
      base.sponsorshipStartDate
    ),
  }
}

export function toSponsorRequestFromRegister(row: SponsorManagementRow): SponsorRequest {
  return {
    name: row.name,
    nameEn: row.nameEn,
    description: row.description,
    contactInfo: row.contactInfo,
    organizationKind: row.organizationKind,
    sponsorshipStatus: row.sponsorshipStatus,
    sponsorshipStartDate:
      row.sponsorshipStartDate != null ? String(row.sponsorshipStartDate) : undefined,
    managers: row.managers,
  }
}

export function toSponsorRequestFromBasicInfo(
  basicInfo: BasicInfoEditState,
  existing: SponsorManagementDetailView
): SponsorRequest {
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
    securityMemo: existing.securityMemo,
  }
}

export function toSponsorContactRequest(
  payload: SponsorContactRegisterPayload,
  contactType: SponsorContactRow['contactType']
): SponsorContactRequest {
  return {
    name: payload.name.trim(),
    position: payload.position.trim(),
    mobilePhone: payload.phone.trim(),
    email: payload.email.trim(),
    primary: contactType === 'lead',
  }
}

export function toSponsorContactUpdateRequest(
  row: SponsorContactRow
): SponsorContactRequest {
  return {
    name: row.name,
    position: row.position,
    mobilePhone: row.phone,
    email: row.email,
    primary: row.contactType === 'lead',
  }
}
