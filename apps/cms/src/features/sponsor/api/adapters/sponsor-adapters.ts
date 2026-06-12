import type {
  SponsorContactRow,
  SponsorManagementDetailView,
  SponsorManagementRow,
  SponsorProgramHistoryRow,
} from '@/features/sponsor/model/sponsor-management.types'
import type { BasicInfoEditState } from '@/features/sponsor/ui/sponsor-detail-basic-info'
import type {
  SponsorContactRequest,
  SponsorContactResponse,
  SponsorDetailResponse,
  SponsorProgramHistoryResponse,
  SponsorRequest,
  SponsorResponse,
} from '@/shared/api/generated/data-management/schemas'
import type {
  SponsorOrganizationKind,
  SponsorSponsorshipStatus,
} from '@/types/domain'
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
    contactInfo: address || existing.contactInfo,
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
