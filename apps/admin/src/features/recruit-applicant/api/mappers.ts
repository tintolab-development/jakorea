/**
 * 인재채용 — OpenAPI ↔ 도메인 매핑
 */

import type {
  RecruitApplicant,
  RecruitApplicantDetail,
  RecruitApplicantListFilter,
  RecruitApplicantStatus,
  RecruitCareerType,
  RecruitEducationLevel,
  RecruitJobInterest,
} from '@/entities/recruit-applicant/model/types'
import type { CareerTalentApplicationDetailResponse } from '@/shared/api/generated/careers/schemas/careerTalentApplicationDetailResponse'
import type { CareerTalentApplicationDetailResponseEducationLevel } from '@/shared/api/generated/careers/schemas/careerTalentApplicationDetailResponseEducationLevel'
import type { CareerTalentApplicationListItem } from '@/shared/api/generated/careers/schemas/careerTalentApplicationListItem'
import type { CareerTalentApplicationListItemCareerType } from '@/shared/api/generated/careers/schemas/careerTalentApplicationListItemCareerType'
import type { CareerTalentApplicationListItemJobInterest } from '@/shared/api/generated/careers/schemas/careerTalentApplicationListItemJobInterest'
import type { CareerTalentApplicationListItemStatus } from '@/shared/api/generated/careers/schemas/careerTalentApplicationListItemStatus'
import type { List15Params } from '@/shared/api/generated/careers/schemas/list15Params'
import { List15CareerType } from '@/shared/api/generated/careers/schemas/list15CareerType'
import { List15JobInterest } from '@/shared/api/generated/careers/schemas/list15JobInterest'
import { List15Status } from '@/shared/api/generated/careers/schemas/list15Status'

export const APPLICANT_LIST_PAGE_SIZE = 20

const JOB_INTEREST: Record<CareerTalentApplicationListItemJobInterest, RecruitJobInterest> = {
  MANAGEMENT_PLANNING: 'managementPlanning',
  PR_DESIGN: 'prDesign',
  ACCOUNTING: 'accounting',
  HR_ADMIN: 'hrAdmin',
  EDUCATION_OPS: 'educationOps',
  OTHER: 'other',
}

const JOB_INTEREST_TO_API: Record<RecruitJobInterest, List15JobInterest> = {
  managementPlanning: List15JobInterest.MANAGEMENT_PLANNING,
  prDesign: List15JobInterest.PR_DESIGN,
  accounting: List15JobInterest.ACCOUNTING,
  hrAdmin: List15JobInterest.HR_ADMIN,
  educationOps: List15JobInterest.EDUCATION_OPS,
  other: List15JobInterest.OTHER,
}

function mapStatus(
  status: CareerTalentApplicationListItemStatus | undefined,
): RecruitApplicantStatus | null {
  if (status === 'PENDING') return 'pending'
  if (status === 'CONFIRMED') return 'confirmed'
  return null
}

function mapCareer(
  careerType: CareerTalentApplicationListItemCareerType | undefined,
): RecruitCareerType | null {
  if (careerType === 'NEWBIE') return 'newbie'
  if (careerType === 'EXPERIENCED') return 'experienced'
  return null
}

export function mapCareerTalentApplicationListItem(
  row: CareerTalentApplicationListItem,
): RecruitApplicant | null {
  if (row.id == null) return null
  const status = mapStatus(row.status)
  const jobInterest = row.jobInterest ? JOB_INTEREST[row.jobInterest] : undefined
  const careerType = mapCareer(row.careerType)
  if (!status || !jobInterest || !careerType) return null
  return {
    id: String(row.id),
    status,
    jobInterest,
    applicantName: row.name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    careerType,
    appliedAt: row.appliedAt ?? '',
    confirmedAt: row.confirmedAt ?? null,
    version: row.version ?? 0,
  }
}

export function toTalentApplicationListParams(
  filter?: RecruitApplicantListFilter,
): List15Params {
  const params: List15Params = {
    page: 0,
    size: APPLICANT_LIST_PAGE_SIZE,
  }
  if (filter?.status === 'pending') params.status = List15Status.PENDING
  if (filter?.status === 'confirmed') params.status = List15Status.CONFIRMED
  if (filter?.jobInterest) params.jobInterest = JOB_INTEREST_TO_API[filter.jobInterest]
  const name = filter?.applicantName?.trim()
  if (name) params.name = name
  const phone = filter?.phone?.trim()
  if (phone) params.phone = phone
  const email = filter?.email?.trim()
  if (email) params.email = email
  if (filter?.careerType === 'newbie') params.careerType = List15CareerType.NEWBIE
  if (filter?.careerType === 'experienced') params.careerType = List15CareerType.EXPERIENCED
  if (filter?.appliedFrom) params.appliedFrom = filter.appliedFrom
  if (filter?.appliedTo) params.appliedTo = filter.appliedTo
  if (filter?.confirmedFrom) params.confirmedFrom = filter.confirmedFrom
  if (filter?.confirmedTo) params.confirmedTo = filter.confirmedTo
  return params
}

const EDUCATION_LEVEL: Record<
  CareerTalentApplicationDetailResponseEducationLevel,
  RecruitEducationLevel
> = {
  HIGH_SCHOOL: 'highSchool',
  COLLEGE: 'college',
  UNIVERSITY: 'university',
  MASTER: 'master',
  DOCTOR: 'doctor',
  OTHER: 'other',
}

export function detailFromListItem(row: RecruitApplicant): RecruitApplicantDetail {
  return {
    ...row,
    addressRoad: '',
    addressDetail: '',
    educationLevel: null,
    schoolName: '',
    major: '',
    educationInfo: '',
    careerInfo: '',
    privacyAgreed: false,
    attachmentFileName: null,
    confirmedByName: null,
  }
}

export function mapCareerTalentApplicationDetail(
  row: CareerTalentApplicationDetailResponse,
): RecruitApplicantDetail | null {
  const base = mapCareerTalentApplicationListItem({
    id: row.id,
    status: row.status,
    jobInterest: row.jobInterest,
    careerType: row.careerType,
    name: row.name,
    phone: row.phone,
    email: row.email,
    appliedAt: row.appliedAt,
    confirmedAt: row.confirmedAt ?? undefined,
    version: row.version,
  })
  if (!base) return null
  const educationLevel = row.educationLevel ? EDUCATION_LEVEL[row.educationLevel] : undefined
  const firstAttachment = row.attachments?.find(
    item => item.assetId != null || Boolean(item.originalName?.trim()),
  )
  const attachmentFileName =
    row.attachmentOriginalName?.trim() || firstAttachment?.originalName?.trim() || null
  return {
    ...base,
    addressRoad: row.addressRoad?.trim() ?? '',
    addressDetail: row.addressDetail?.trim() ?? '',
    educationLevel: educationLevel ?? null,
    schoolName: row.schoolName?.trim() ?? '',
    major: row.major?.trim() ?? '',
    educationInfo: row.educationInfo ?? '',
    careerInfo: row.careerInfo ?? '',
    privacyAgreed: row.privacyAgreed === true,
    attachmentFileName,
    attachmentAssetId: firstAttachment?.assetId,
    confirmedByName: row.confirmedByName?.trim() ? row.confirmedByName.trim() : null,
  }
}

export function toNumericId(id: string): number {
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('지원자 id가 올바르지 않습니다.')
  }
  return numericId
}
