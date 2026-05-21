import type { UjatVolunteerRecruitHalf } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

export function getUjatVolunteerDocScreeningDetailTitle(
  half: UjatVolunteerRecruitHalf,
  applicantName: string
): string {
  const halfLabel = half === 'h1' ? '상반기' : '하반기'
  return `${halfLabel} 1차 서류 심사 대상자 상세 (${applicantName})`
}

export function getUjatVolunteerDocPassedDetailTitle(
  half: UjatVolunteerRecruitHalf,
  applicantName: string
): string {
  const halfLabel = half === 'h1' ? '상반기' : '하반기'
  return `${halfLabel} 1차 서류 합격자 상세 (${applicantName})`
}

export function getUjatVolunteerInterview2DetailTitle(
  half: UjatVolunteerRecruitHalf,
  applicantName: string
): string {
  const halfLabel = half === 'h1' ? '상반기' : '하반기'
  return `${halfLabel} 2차 면접 대상자 상세 (${applicantName})`
}
