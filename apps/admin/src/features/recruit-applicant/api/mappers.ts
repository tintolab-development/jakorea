/**
 * 인재채용 — OpenAPI ↔ 도메인 매핑
 * 목록 쿼리는 status·page·size만 보낸다.
 */

import type {
  RecruitApplicant,
  RecruitApplicantListFilter,
  RecruitApplicantStatus,
  RecruitCareerType,
  RecruitJobInterest,
} from '@/entities/recruit-applicant/model/types'
import type { CareerTalentApplicationListItem } from '@/shared/api/generated/careers/schemas/careerTalentApplicationListItem'
import type { CareerTalentApplicationListItemCareerType } from '@/shared/api/generated/careers/schemas/careerTalentApplicationListItemCareerType'
import type { CareerTalentApplicationListItemJobInterest } from '@/shared/api/generated/careers/schemas/careerTalentApplicationListItemJobInterest'
import type { CareerTalentApplicationListItemStatus } from '@/shared/api/generated/careers/schemas/careerTalentApplicationListItemStatus'
import type { List14Params } from '@/shared/api/generated/careers/schemas/list14Params'
import { List14Status } from '@/shared/api/generated/careers/schemas/list14Status'

export const APPLICANT_LIST_PAGE_SIZE = 20

const JOB_INTEREST: Record<CareerTalentApplicationListItemJobInterest, RecruitJobInterest> = {
  MANAGEMENT_PLANNING: 'managementPlanning',
  PR_DESIGN: 'prDesign',
  ACCOUNTING: 'accounting',
  HR_ADMIN: 'hrAdmin',
  EDUCATION_OPS: 'educationOps',
  OTHER: 'other',
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
    appliedAt: '',
    confirmedAt: row.confirmedAt ?? null,
    version: row.version ?? 0,
  }
}

export function toTalentApplicationListParams(
  filter?: RecruitApplicantListFilter,
): List14Params {
  const status =
    filter?.status === 'pending'
      ? List14Status.PENDING
      : filter?.status === 'confirmed'
        ? List14Status.CONFIRMED
        : undefined
  return {
    status,
    page: 0,
    size: APPLICANT_LIST_PAGE_SIZE,
  }
}

export function toNumericId(id: string): number {
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw new Error('지원자 id가 올바르지 않습니다.')
  }
  return numericId
}
