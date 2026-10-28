/**
 * 재능기부 신청 — OpenAPI ↔ 도메인 매핑
 */

import type {
  ApplicantGender,
  ApplicationStatus,
  TalentDonationApplication,
  TalentDonationApplicationListFilter,
} from '@/entities/talent-donation-application/model/types'
import type { List13Params } from '@/shared/api/generated/sponsorship/schemas/list13Params'
import type { ApplicationAttachmentItem } from '@/shared/api/generated/sponsorship/schemas/applicationAttachmentItem'
import type { TalentApplicationDetailResponse } from '@/shared/api/generated/sponsorship/schemas/talentApplicationDetailResponse'
import type { TalentApplicationListItem } from '@/shared/api/generated/sponsorship/schemas/talentApplicationListItem'
import type { TalentApplicationStatusUpdateRequest } from '@/shared/api/generated/sponsorship/schemas/talentApplicationStatusUpdateRequest'
import { TalentApplicationStatusUpdateRequestStatus } from '@/shared/api/generated/sponsorship/schemas/talentApplicationStatusUpdateRequestStatus'
import { List13JaParticipation } from '@/shared/api/generated/sponsorship/schemas/list13JaParticipation'
import { List13Status } from '@/shared/api/generated/sponsorship/schemas/list13Status'

export const LIST_PAGE_SIZE = 20

function joinAddress(sido?: string | null, sigungu?: string | null): string {
  return [sido?.trim(), sigungu?.trim()].filter(Boolean).join(' ')
}

function toDomainStatus(status: string | undefined): ApplicationStatus {
  return status === 'confirmed' ? 'confirmed' : 'pending'
}

function toDomainGender(gender: string | undefined): ApplicantGender {
  return gender === 'female' ? 'female' : 'male'
}

function firstApplicationAttachment(
  attachments: ApplicationAttachmentItem[] | undefined,
  originalName?: string | null,
): { fileName: string | null; assetId?: number } {
  const first = attachments?.find(
    item => item.assetId != null || Boolean(item.originalName?.trim()),
  )
  const fileName = originalName?.trim() || first?.originalName?.trim() || null
  return {
    fileName,
    ...(first?.assetId != null ? { assetId: first.assetId } : {}),
  }
}

export function mapTalentApplicationListItemToDomain(
  row: TalentApplicationListItem,
): TalentDonationApplication {
  return {
    id: row.id != null ? String(row.id) : '',
    status: toDomainStatus(row.status),
    applicantName: row.name ?? '',
    gender: toDomainGender(row.gender),
    birthDate: '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    affiliation: '',
    homeAddress: joinAddress(row.sido, row.sigungu),
    availableFrom: '',
    availableTo: '',
    bio: '',
    talentIntro: '',
    motivation: '',
    jaProgramHistory: row.jaParticipation === 'yes',
    attachmentFileName: null,
    attachmentUrl: null,
    privacyConsent: true,
    appliedAt: row.appliedAt ?? '',
    confirmedAt: row.confirmedAt ?? null,
    confirmedByName: row.confirmedByName?.trim() ? row.confirmedByName.trim() : null,
    version: 0,
  }
}

export function mapTalentApplicationDetailToDomain(
  row: TalentApplicationDetailResponse,
): TalentDonationApplication {
  const attachment = firstApplicationAttachment(row.attachments, row.attachmentOriginalName)
  return {
    id: row.id != null ? String(row.id) : '',
    status: toDomainStatus(row.status),
    applicantName: row.name ?? '',
    gender: toDomainGender(row.gender),
    birthDate: row.birthDate ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    affiliation: row.affiliation ?? '',
    homeAddress: joinAddress(row.sido, row.sigungu),
    availableFrom: row.periodStart ?? '',
    availableTo: row.periodEnd ?? '',
    bio: row.bio ?? '',
    talentIntro: row.talentIntro ?? '',
    motivation: row.motivation ?? '',
    jaProgramHistory: row.jaParticipation === 'yes',
    attachmentFileName: attachment.fileName,
    attachmentAssetId: attachment.assetId,
    attachmentUrl: null,
    // 서버는 privacyAgreed=true만 저장·반환 (도메인 타입도 true 리터럴)
    privacyConsent: true,
    appliedAt: row.appliedAt ?? '',
    confirmedAt: row.confirmedAt ?? null,
    confirmedByName: row.confirmedByName?.trim() ? row.confirmedByName.trim() : null,
    version: 0,
  }
}

export function toTalentApplicationListParams(
  filter: TalentDonationApplicationListFilter = {},
): List13Params {
  const params: List13Params = {
    page: 0,
    size: LIST_PAGE_SIZE,
  }
  if (filter.status === 'pending') params.status = List13Status.pending
  if (filter.status === 'confirmed') params.status = List13Status.confirmed
  const applicantName = filter.applicantName?.trim()
  if (applicantName) params.applicantName = applicantName
  const phone = filter.phone?.trim()
  if (phone) params.phone = phone
  const email = filter.email?.trim()
  if (email) params.email = email
  if (filter.jaProgramHistory === 'yes') {
    params.jaParticipation = List13JaParticipation.yes
  } else if (filter.jaProgramHistory === 'no') {
    params.jaParticipation = List13JaParticipation.no
  }
  if (filter.appliedFrom) params.appliedFrom = filter.appliedFrom
  if (filter.appliedTo) params.appliedTo = filter.appliedTo
  if (filter.confirmedFrom) params.confirmedFrom = filter.confirmedFrom
  if (filter.confirmedTo) params.confirmedTo = filter.confirmedTo
  return params
}

export function toTalentApplicationStatusUpdateRequest(
  status: ApplicationStatus,
): TalentApplicationStatusUpdateRequest {
  return {
    status:
      status === 'confirmed'
        ? TalentApplicationStatusUpdateRequestStatus.confirmed
        : TalentApplicationStatusUpdateRequestStatus.pending,
  }
}
