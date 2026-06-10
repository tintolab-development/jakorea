import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'

export interface ParticipatingVolunteersFilters {
  volunteerName: string
  id1365: string
}

export const DEFAULT_PARTICIPATING_VOLUNTEERS_FILTERS: ParticipatingVolunteersFilters = {
  volunteerName: '',
  id1365: '',
}

export function filterParticipatingVolunteers(
  rows: readonly ParticipatingVolunteerRow[],
  filters: ParticipatingVolunteersFilters
): ParticipatingVolunteerRow[] {
  const nameQ = filters.volunteerName.trim().toLowerCase()
  const idQ = filters.id1365.trim()

  return rows.filter(row => {
    if (nameQ && !row.volunteerName.toLowerCase().includes(nameQ)) return false
    if (idQ && !row.id1365.includes(idQ)) return false
    return true
  })
}

export function formatParticipatingVolunteerAssignedInstitutions(names: string[]): string {
  const unique = [...new Set(names.filter(Boolean))]
  if (!unique.length) return '-'
  if (unique.length === 1) return unique[0]
  return `${unique[0]} 외 ${unique.length - 1}개`
}
