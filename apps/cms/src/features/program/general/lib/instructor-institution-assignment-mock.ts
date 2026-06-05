/**
 * 참여 강사 풀페이지 — 기관 배정 현황 탭용 목 데이터
 */

import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { InstructorRoleKey } from '../model/school-detail-types'

const MOCK_REQUIRED_INSTRUCTOR_SLOTS = 4

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

const ASSIGNED_DISTANCES = ['3km', '5km', '7km', '4km', '6km', '8km']
const ASSIGNED_DATES = ['2026. 01. 09(금)', '2026. 01. 10(토)', '2026. 01. 11(일)']
const ASSIGNED_TIMES = [
  '1교시 (9:20 ~ 10:10)',
  '2교시 (10:20 ~ 11:10)',
  '3교시 (11:20 ~ 12:10)',
]
const ASSIGNED_SESSIONS = ['1차시', '2차시', '3차시', '4차시']

const WAITING_ASSIGNMENT_STATUSES = [
  'waiting',
  'assigned',
  'waiting',
  'assigned',
  'cancelled',
  'assigned',
  'waiting',
] as const

const WAITING_HOPE_DATES = ['2026. 01. 16(금)', '2026. 01. 17(토)', '2026. 01. 18(일)']
const WAITING_HOPE_TIMES = [
  '1교시 (9:20 ~ 10:10)',
  '2교시 (10:20 ~ 11:10)',
  '3교시 (11:20 ~ 12:10)',
]
const WAITING_HOPE_SESSIONS = ['1차시', '2차시', '3차시', '4차시']
const WAITING_DISTANCES = ['2km', '4km', '6km', '5km', '7km', '32km', '12km']

export type InstructorWaitingAssignmentStatus = 'waiting' | 'cancelled' | 'assigned'

/** 배정 완료 행은 No.와 무관하게 목록 하단에 노출 */
export function sortWaitingRowsAssignedToBottom<
  T extends { no: number; assignmentStatus: InstructorWaitingAssignmentStatus },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aAssigned = a.assignmentStatus === 'assigned' ? 1 : 0
    const bAssigned = b.assignmentStatus === 'assigned' ? 1 : 0
    if (aAssigned !== bAssigned) return aAssigned - bAssigned
    return b.no - a.no
  })
}

export interface InstructorAssignedSchoolRow {
  id: string
  no: number
  role: InstructorRoleKey
  schoolName: string
  region: string
  distanceFromHome: string
  assignedDate: string
  assignedTime: string
  assignedSession: string
  instructorAssignmentLabel: string
}

export interface InstructorWaitingSchoolRow {
  id: string
  no: number
  schoolName: string
  region: string
  distanceFromHome: string
  assignmentStatus: InstructorWaitingAssignmentStatus
  hopeDate: string
  hopeTime: string
  hopeSession: string
  instructorCountLabel: string
}

function countInstructorsAtSchool(
  schoolName: string,
  instructorList: ParticipatingInstructorRow[]
): number {
  return instructorList.filter(r => r.schoolName === schoolName).length
}

function instructorSlotsLabel(schoolName: string, instructorList: ParticipatingInstructorRow[]): string {
  const n = countInstructorsAtSchool(schoolName, instructorList)
  return `${n}/${MOCK_REQUIRED_INSTRUCTOR_SLOTS}`
}

/** 배정된 학교 3건 목업: 강사의 schoolName 학교 필수 포함 + 나머지 2교 */
export function buildInitialAssignedSchoolRows(
  instructor: ParticipatingInstructorRow,
  schools: ParticipatingSchoolRow[],
  instructorList: ParticipatingInstructorRow[]
): InstructorAssignedSchoolRow[] {
  if (schools.length === 0) return []

  const seed = hash(instructor.id)
  const primary =
    schools.find(s => s.schoolName === instructor.schoolName) ?? schools[seed % schools.length]

  const rest = schools.filter(s => s.id !== primary.id)
  const sortedRest = [...rest].sort(
    (a, b) => hash(a.id + instructor.id) - hash(b.id + instructor.id)
  )
  const pickedSchools = [primary, ...sortedRest.slice(0, 2)]

  return pickedSchools.map((school, idx) => {
    const rowSeed = hash(school.id + instructor.id)
    return {
      id: school.id,
      no: pickedSchools.length - idx,
      role: idx === 0 ? ('lead' satisfies InstructorRoleKey) : ('assistant' satisfies InstructorRoleKey),
      schoolName: school.schoolName,
      region: school.region,
      distanceFromHome: pick(ASSIGNED_DISTANCES, rowSeed + idx),
      assignedDate: pick(ASSIGNED_DATES, rowSeed % 3),
      assignedTime: pick(ASSIGNED_TIMES, idx % 3),
      assignedSession: pick(ASSIGNED_SESSIONS, idx % 4),
      instructorAssignmentLabel: instructorSlotsLabel(school.schoolName, instructorList),
    }
  })
}

/** 배정되지 않은 학교 목록 (배정 대기 테이블) */
export function buildWaitingSchoolRows(
  instructor: ParticipatingInstructorRow,
  schools: ParticipatingSchoolRow[],
  instructorList: ParticipatingInstructorRow[],
  assignedSchoolIds: Set<string>
): InstructorWaitingSchoolRow[] {
  const pool = schools.filter(s => !assignedSchoolIds.has(s.id))
  const sorted = [...pool].sort(
    (a, b) => hash(a.id + instructor.id + 'w') - hash(b.id + instructor.id + 'w')
  )
  const slice = sorted.slice(0, 12)
  const n = slice.length

  return sortWaitingRowsAssignedToBottom(
    slice.map((school, idx) => {
      const rowSeed = hash(school.id + instructor.id)
      return {
        id: school.id,
        no: n - idx,
        schoolName: school.schoolName,
        region: school.region,
        distanceFromHome: pick(WAITING_DISTANCES, rowSeed + idx),
        assignmentStatus: pick([...WAITING_ASSIGNMENT_STATUSES], rowSeed + idx),
        hopeDate: pick(WAITING_HOPE_DATES, idx % 3),
        hopeTime: pick(WAITING_HOPE_TIMES, idx % 3),
        hopeSession: pick(WAITING_HOPE_SESSIONS, idx % 4),
        instructorCountLabel: instructorSlotsLabel(school.schoolName, instructorList),
      }
    })
  )
}

export function schoolRowToAssignedRow(
  school: ParticipatingSchoolRow,
  instructor: ParticipatingInstructorRow,
  instructorList: ParticipatingInstructorRow[],
  no: number,
  role: InstructorRoleKey,
  idx: number
): InstructorAssignedSchoolRow {
  const rowSeed = hash(school.id + instructor.id)
  return {
    id: school.id,
    no,
    role,
    schoolName: school.schoolName,
    region: school.region,
    distanceFromHome: pick(ASSIGNED_DISTANCES, rowSeed + idx),
    assignedDate: pick(ASSIGNED_DATES, rowSeed % 3),
    assignedTime: pick(ASSIGNED_TIMES, idx % 3),
    assignedSession: pick(ASSIGNED_SESSIONS, idx % 4),
    instructorAssignmentLabel: instructorSlotsLabel(school.schoolName, instructorList),
  }
}

export function createWaitingRowForSchool(
  school: ParticipatingSchoolRow,
  instructor: ParticipatingInstructorRow,
  instructorList: ParticipatingInstructorRow[],
  no: number,
  assignmentStatus: InstructorWaitingAssignmentStatus = 'waiting'
): InstructorWaitingSchoolRow {
  const rowSeed = hash(school.id + instructor.id + 'back')
  return {
    id: school.id,
    no,
    schoolName: school.schoolName,
    region: school.region,
    distanceFromHome: pick(WAITING_DISTANCES, rowSeed),
    assignmentStatus,
    hopeDate: pick(WAITING_HOPE_DATES, rowSeed % 3),
    hopeTime: pick(WAITING_HOPE_TIMES, rowSeed % 3),
    hopeSession: pick(WAITING_HOPE_SESSIONS, rowSeed % 4),
    instructorCountLabel: instructorSlotsLabel(school.schoolName, instructorList),
  }
}

/** No. 컬럼 재계산 (내림차순) */
export function renumberAssignedRows(rows: InstructorAssignedSchoolRow[]): InstructorAssignedSchoolRow[] {
  const n = rows.length
  return rows.map((r, i) => ({ ...r, no: n - i }))
}

export function renumberWaitingRows(rows: InstructorWaitingSchoolRow[]): InstructorWaitingSchoolRow[] {
  const sorted = sortWaitingRowsAssignedToBottom(rows)
  const n = sorted.length
  return sorted.map((r, i) => ({ ...r, no: n - i }))
}

export { MOCK_REQUIRED_INSTRUCTOR_SLOTS }
