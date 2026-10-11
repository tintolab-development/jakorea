import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import type { Program } from '@/types/domain'

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

/** 참여 봉사자 목록 — 기관명(기관형) / 배정 기관(개인형) 셀 */
export function formatParticipatingVolunteerInstitutionCell(
  row: ParticipatingVolunteerRow,
  program?: Program | null
): string {
  const assigned = formatParticipatingVolunteerAssignedInstitutions(row.assignedInstitutionNames)
  if (assigned !== '-') return assigned
  if (program && isGeneralIndividualProgram(program)) {
    const affiliation = row.affiliation?.trim()
    if (affiliation) return affiliation
  }
  return '-'
}

export function participatingVolunteerInstitutionColumnTitle(program?: Program | null): string {
  return program && isGeneralIndividualProgram(program) ? '배정 기관' : '기관명'
}
