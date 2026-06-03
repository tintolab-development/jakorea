import { MOCK_APPLICANT_INSTRUCTORS } from '@/data/mock/applicant-instructors'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import { MOCK_APPLICANT_INSTITUTIONS } from '@/data/mock/applicant-institutions'

export const LONG_DISTANCE_THRESHOLD_KM = 60

const SCHOOL_BY_NAME = new Map<string, ApplicantSchoolRow>(
  MOCK_APPLICANT_INSTITUTIONS.map(s => [s.schoolName, s])
)

function stableHash(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) >>> 0
  }
  return h
}

export function getInstructorScheduleDistanceKm(
  schoolName: string,
  instructorName: string,
  instructorAddress?: string
): number {
  const schoolRegion = SCHOOL_BY_NAME.get(schoolName)?.region ?? schoolName
  const seed = `${schoolRegion}|${instructorAddress ?? ''}|${instructorName}`
  return 20 + (stableHash(seed) % 121)
}

export function getInstructorScheduleDispatchStats(instructorName: string): {
  dispatchCount: number
  longDistanceCount: number
} {
  const approvedRows = MOCK_APPLICANT_INSTRUCTORS.filter(
    row => row.instructorName === instructorName && row.approvalStatus === 'approved'
  )
  const longDistanceCount = approvedRows.filter(
    row =>
      getInstructorScheduleDistanceKm(row.schoolName, row.instructorName, row.address) >
      LONG_DISTANCE_THRESHOLD_KM
  ).length
  return {
    dispatchCount: approvedRows.length,
    longDistanceCount,
  }
}
