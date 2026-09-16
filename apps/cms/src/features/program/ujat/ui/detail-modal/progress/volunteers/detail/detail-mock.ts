import { getUjatEducationProgressVolunteerMockRows } from '@/features/program/ujat/model/ujat-education-progress'
import {
  buildUjatVolunteerApplicantId,
  getUjatVolunteerMockProfile,
  parseEducationProgressVolunteerProfileId,
} from '@/features/program/ujat/model/ujat-volunteer-mock-profile'
import { findUjatVolunteerApplicantById } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { EducationProgressHalfKey } from '../../tabs'
import type { UjatEducationProgressVolunteerRow } from '../types'

export type UjatEducationProgressVolunteerDetail = {
  volunteerId: string
  half: EducationProgressHalfKey
  row: UjatEducationProgressVolunteerRow
  applicant: UjatVolunteerApplicantRow
  adminComment: string
}

function recruitHalfFromProgress(half: EducationProgressHalfKey): UjatVolunteerRecruitHalf {
  return half === 'h2' ? 'h2' : 'h1'
}

export function isUjatEducationProgressVolunteerInList(
  _half: EducationProgressHalfKey,
  volunteerId: string
): boolean {
  void _half
  return Boolean(volunteerId)
}

export function getUjatEducationProgressVolunteerDetail(
  programId: string,
  half: EducationProgressHalfKey,
  volunteerId: string
): UjatEducationProgressVolunteerDetail | null {
  const row = getUjatEducationProgressVolunteerMockRows(half).find(r => r.id === volunteerId)
  if (!row) return null

  const recruitHalf = recruitHalfFromProgress(half)
  const profileId = parseEducationProgressVolunteerProfileId(volunteerId)
  const profile = profileId ? getUjatVolunteerMockProfile(profileId) : undefined

  const applicant =
    (profileId
      ? findUjatVolunteerApplicantById(
          programId,
          recruitHalf,
          buildUjatVolunteerApplicantId(programId, recruitHalf, profileId)
        )
      : undefined) ?? null

  if (!applicant) return null

  return {
    volunteerId,
    half,
    row,
    applicant,
    adminComment: profile?.adminComment ?? '',
  }
}

export function formatUjatEducationProgressVolunteerDetailTitle(
  half: EducationProgressHalfKey,
  volunteerName: string
): string {
  const halfLabel = half === 'h2' ? '하반기' : '상반기'
  return `${halfLabel} 봉사자 상세 (${volunteerName})`
}
