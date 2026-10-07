import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import type { EducationProgressHalfKey } from '../../tabs'
import type { UjatEducationProgressVolunteerRow } from '../types'

export type UjatEducationProgressVolunteerDetail = {
  volunteerId: string
  half: EducationProgressHalfKey
  row: UjatEducationProgressVolunteerRow
  applicant: UjatVolunteerApplicantRow
  adminComment: string
}

export function isUjatEducationProgressVolunteerInList(
  _half: EducationProgressHalfKey,
  volunteerId: string
): boolean {
  void _half
  return Boolean(volunteerId)
}

export function getUjatEducationProgressVolunteerDetail(
  _programId: string,
  _half: EducationProgressHalfKey,
  _volunteerId: string
): UjatEducationProgressVolunteerDetail | null {
  return null
}

export function formatUjatEducationProgressVolunteerDetailTitle(
  half: EducationProgressHalfKey,
  volunteerName: string
): string {
  const halfLabel = half === 'h2' ? '하반기' : '상반기'
  return `${halfLabel} 봉사자 상세 (${volunteerName})`
}
