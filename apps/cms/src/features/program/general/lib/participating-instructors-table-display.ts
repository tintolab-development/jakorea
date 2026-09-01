import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import { buildInitialAssignedSchoolRows } from './instructor-institution-assignment-mock'

/** 자택 주소지 — 시/도·시/군/구까지 표시 */
export function formatParticipatingInstructorHomeAddress(address?: string): string {
  if (!address) return '-'
  const parts = address.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return parts.join(' ')
  return `${parts[0]} ${parts[1]}`
}

/** 참여 강사 상세 배정 탭과 동일한 배정 기관명 목록 */
export function getParticipatingInstructorAssignedSchoolNames(
  instructor: ParticipatingInstructorRow,
  schoolRows: ParticipatingSchoolRow[],
  instructorList: ParticipatingInstructorRow[]
): string[] {
  return buildInitialAssignedSchoolRows(instructor, schoolRows, instructorList).map(
    row => row.schoolName
  )
}

/** 배정 기관명 — 가나다순 첫 기관 + 외 N개 (없으면 `-`) */
export function formatParticipatingInstructorAssignedInstitutions(names: string[]): string {
  const unique = [...new Set(names.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'))
  if (!unique.length) return '-'
  if (unique.length === 1) return unique[0]
  return `${unique[0]} 외 ${unique.length - 1}개`
}
