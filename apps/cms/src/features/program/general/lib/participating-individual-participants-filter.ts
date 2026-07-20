import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'

export interface ParticipatingIndividualParticipantsFilters {
  participantName: string
  educationGrade: string
  homeSido: string
  homeSigungu: string
}

export const DEFAULT_PARTICIPATING_INDIVIDUAL_PARTICIPANTS_FILTERS: ParticipatingIndividualParticipantsFilters =
  {
    participantName: '',
    educationGrade: 'all',
    homeSido: '',
    homeSigungu: '',
  }

function matchesAddressRegion(
  address: string,
  sido: string,
  sigungu: string
): boolean {
  const sidoStr = sido.trim()
  const sigunguStr = sigungu.trim()
  if (sidoStr && !address.includes(sidoStr)) return false
  if (sigunguStr && !address.includes(sigunguStr)) return false
  return true
}

export function filterParticipatingIndividualParticipants(
  rows: ParticipatingIndividualParticipantRow[],
  appliedFilters: ParticipatingIndividualParticipantsFilters
): ParticipatingIndividualParticipantRow[] {
  const participantName = appliedFilters.participantName.trim()
  const grade = appliedFilters.educationGrade

  return rows.filter(item => {
    if (participantName && !item.applicantName.includes(participantName)) return false
    if (grade && grade !== 'all' && item.educationGrade !== grade) return false
    if (
      !matchesAddressRegion(
        item.homeAddress,
        appliedFilters.homeSido,
        appliedFilters.homeSigungu
      )
    ) {
      return false
    }
    return true
  })
}
