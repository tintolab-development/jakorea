/**
 * 참여 봉사자 풀페이지 — 봉사 배정 현황 탭용 목 데이터
 */

import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import type { Program } from '@/types/domain'
import { formatVolunteerAssignmentScheduleLine } from './participating-school-session-display'
import {
  buildWaitingInstructorScheduleSlotKey,
  participatingSchoolSessionToHopeSchedule,
  resolveWaitingInstructorAssignmentStatus,
  sortWaitingInstructorRowsUnavailableToBottom,
  type WaitingInstructorAssignmentStatus,
  type WaitingInstructorHopeSchedule,
} from './waiting-instructor-assignment'

const ASSIGNED_DISTANCES = ['3km', '5km', '7km', '4km', '6km', '8km']
const WAITING_DISTANCES = ['2km', '4km', '6km', '5km', '7km', '32km', '12km']

/** 배정 대기 목록 — 기관+일정별 행 식별자 */
export type VolunteerWaitingAssignmentStatus = WaitingInstructorAssignmentStatus

export interface VolunteerAssignedInstitutionRow {
  id: string
  no: number
  schoolName: string
  educationGrade: string
  region: string
  distanceFromHome: string
  volunteerScheduleLines: string[]
}

export interface VolunteerWaitingInstitutionRow {
  id: string
  no: number
  schoolId: string
  schoolName: string
  desiredGrade: string
  region: string
  distanceFromHome: string
  hopeScheduleLine: string
  hopeSchedule: WaitingInstructorHopeSchedule
  assignmentStatus: VolunteerWaitingAssignmentStatus
  assignedVolunteerCountLabel: string
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

function demoTintoElementarySchool(): ParticipatingSchoolRow {
  return {
    id: 'school-tinto-elementary',
    no: 0,
    schoolName: '틴토초등학교',
    region: '서울특별시 강서구',
    educationGrade: '3학년',
    classCount: 2,
    studentCount: 48,
    lectureRound: '진행 전',
    textbookStatus: 'preparing',
    approvalStatus: 'approved',
    teacherName: '김선생',
    instructors: '-',
    sessions: [
      {
        round: 1,
        date: '2026.01.09',
        dayOfWeek: '금',
        duration: '2시간',
        format: '오프라인',
        classNum: '1교시',
        timeRange: '9:20~11:20',
        status: 'pending',
      },
      {
        round: 2,
        date: '2026.01.07',
        dayOfWeek: '수',
        duration: '2시간',
        format: '오프라인',
        classNum: '1교시',
        timeRange: '9:20~11:20',
        status: 'pending',
      },
      {
        round: 3,
        date: '2026.01.16',
        dayOfWeek: '금',
        duration: '2시간',
        format: '오프라인',
        classNum: '2교시',
        timeRange: '9:30~11:30',
        status: 'pending',
      },
    ],
  }
}

export function resolveVolunteerAssignmentSchoolPool(
  schoolRows: ParticipatingSchoolRow[]
): ParticipatingSchoolRow[] {
  const hasTinto = schoolRows.some(s => s.schoolName === '틴토초등학교')
  return hasTinto ? schoolRows : [demoTintoElementarySchool(), ...schoolRows]
}

function scheduleLineForSession(
  session: ParticipatingSchoolSession,
  program?: Program
): string {
  return formatVolunteerAssignmentScheduleLine(session, program)
}

function scheduleLinesForSchool(
  school: ParticipatingSchoolRow,
  volunteer: ParticipatingVolunteerRow,
  program?: Program
): string[] {
  const fromSchool = school.sessions?.map(s => scheduleLineForSession(s, program)) ?? []
  if (fromSchool.length > 0) return fromSchool

  const volunteerSessions = volunteer.sessions ?? []
  if (volunteerSessions.length > 0) {
    return volunteerSessions.map(s => scheduleLineForSession(s, program))
  }

  return ['2026. 01. 09(금) 09:20 ~ 11:20 | 1차시']
}

function buildOccupiedVolunteerScheduleSlots(volunteer: ParticipatingVolunteerRow): Set<string> {
  const occupied = new Set<string>()
  for (const session of volunteer.sessions ?? []) {
    occupied.add(
      buildWaitingInstructorScheduleSlotKey(participatingSchoolSessionToHopeSchedule(session))
    )
  }
  return occupied
}

function countVolunteersAtInstitutionSession(
  volunteerList: ParticipatingVolunteerRow[],
  schoolName: string,
  session: ParticipatingSchoolSession
): number {
  const slotKey = buildWaitingInstructorScheduleSlotKey(
    participatingSchoolSessionToHopeSchedule(session)
  )
  let count = 0
  for (const v of volunteerList) {
    if (!v.assignedInstitutionNames.includes(schoolName)) continue
    for (const s of v.sessions ?? []) {
      if (
        buildWaitingInstructorScheduleSlotKey(participatingSchoolSessionToHopeSchedule(s)) ===
        slotKey
      ) {
        count += 1
        break
      }
    }
  }
  return count > 0 ? count : 3 + (hash(schoolName + session.date) % 3)
}

function volunteerCountLabel(
  volunteerList: ParticipatingVolunteerRow[],
  schoolName: string,
  session: ParticipatingSchoolSession
): string {
  const n = countVolunteersAtInstitutionSession(volunteerList, schoolName, session)
  return `${n}명`
}

function buildParktintoAssignedRows(
  schoolPool: ParticipatingSchoolRow[],
  volunteer: ParticipatingVolunteerRow,
  program?: Program
): VolunteerAssignedInstitutionRow[] {
  const gangseo =
    schoolPool.find(s => s.schoolName === '강서초등학교' && s.educationGrade === '3학년') ??
    schoolPool.find(s => s.schoolName === '강서초등학교')
  const mapo = schoolPool.find(s => s.schoolName === '마포초등학교')
  const picked = [gangseo, mapo, gangseo].filter((s): s is ParticipatingSchoolRow => Boolean(s))

  return picked.map((school, idx) => {
    const rowSeed = hash(school.id + volunteer.id + String(idx))
    return {
      id: `${school.id}__assigned_${idx}`,
      no: picked.length - idx,
      schoolName: school.schoolName,
      educationGrade: school.educationGrade,
      region: school.region,
      distanceFromHome: pick(ASSIGNED_DISTANCES, rowSeed + idx),
      volunteerScheduleLines: scheduleLinesForSchool(school, volunteer, program),
    }
  })
}

/** 배정된 기관 목록 — 기관 단위(한 기관에 복수 일정 가능) */
export function buildInitialVolunteerAssignedRows(
  volunteer: ParticipatingVolunteerRow,
  schoolRows: ParticipatingSchoolRow[],
  program?: Program
): VolunteerAssignedInstitutionRow[] {
  const schoolPool = resolveVolunteerAssignmentSchoolPool(schoolRows)

  if (volunteer.id === 'participating-volunteer-demo-parktinto') {
    return buildParktintoAssignedRows(schoolPool, volunteer, program)
  }

  const assignedNames = volunteer.assignedInstitutionNames ?? []
  if (assignedNames.length === 0) return []

  const picked = assignedNames
    .map(name => schoolPool.find(s => s.schoolName === name))
    .filter((s): s is ParticipatingSchoolRow => Boolean(s))

  if (picked.length === 0) return []

  return picked.map((school, idx) => {
    const rowSeed = hash(school.id + volunteer.id)
    return {
      id: `${school.id}__assigned`,
      no: picked.length - idx,
      schoolName: school.schoolName,
      educationGrade: school.educationGrade,
      region: school.region,
      distanceFromHome: pick(ASSIGNED_DISTANCES, rowSeed + idx),
      volunteerScheduleLines: scheduleLinesForSchool(school, volunteer, program),
    }
  })
}

function expandSchoolSessionsToWaitingRows(
  school: ParticipatingSchoolRow,
  volunteer: ParticipatingVolunteerRow,
  volunteerList: ParticipatingVolunteerRow[],
  occupiedSlots: Set<string>,
  program?: Program
): VolunteerWaitingInstitutionRow[] {
  const sessions =
    school.sessions && school.sessions.length > 0
      ? school.sessions
      : [
          {
            round: 1,
            date: '2026.01.09',
            dayOfWeek: '금',
            duration: '2시간',
            format: '오프라인',
            classNum: '1교시',
            timeRange: '9:20~11:20',
            status: 'pending' as const,
          },
        ]

  return sessions.map((session, sessionIdx) => {
    const hopeSchedule = participatingSchoolSessionToHopeSchedule(session)
    const rowSeed = hash(school.id + volunteer.id + session.date + String(session.round))
    return {
      id: `${school.id}__${session.date}__${session.round}`,
      no: 0,
      schoolId: school.id,
      schoolName: school.schoolName,
      desiredGrade: school.educationGrade,
      region: school.region,
      distanceFromHome: pick(WAITING_DISTANCES, rowSeed + sessionIdx),
      hopeScheduleLine: scheduleLineForSession(session, program),
      hopeSchedule,
      assignmentStatus: resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedSlots),
      assignedVolunteerCountLabel: volunteerCountLabel(volunteerList, school.schoolName, session),
    }
  })
}

/** 배정 대기 기관 목록 — 기관+일정별 행 분리, 배정 완료 건 비노출 */
export function buildVolunteerWaitingInstitutionRows(
  volunteer: ParticipatingVolunteerRow,
  schoolRows: ParticipatingSchoolRow[],
  volunteerList: ParticipatingVolunteerRow[],
  assignedRowIds: Set<string>,
  program?: Program
): VolunteerWaitingInstitutionRow[] {
  const schoolPool = resolveVolunteerAssignmentSchoolPool(schoolRows)
  const assignedSchoolIds = new Set(
    [...assignedRowIds].map(id => id.split('__assigned')[0] ?? id)
  )
  const occupiedSlots = buildOccupiedVolunteerScheduleSlots(volunteer)

  let candidateSchools: ParticipatingSchoolRow[]

  if (volunteer.id === 'participating-volunteer-demo-parktinto') {
    const tinto = schoolPool.find(s => s.schoolName === '틴토초등학교') ?? demoTintoElementarySchool()
    const extras = schoolPool
      .filter(s => s.schoolName !== '틴토초등학교' && !assignedSchoolIds.has(s.id))
      .slice(0, 2)
    candidateSchools = [tinto, ...extras]
  } else {
    candidateSchools = schoolPool.filter(s => !assignedSchoolIds.has(s.id))
  }

  const sorted = [...candidateSchools].sort(
    (a, b) => hash(a.id + volunteer.id + 'w') - hash(b.id + volunteer.id + 'w')
  )

  const expanded = sorted.flatMap(school =>
    expandSchoolSessionsToWaitingRows(school, volunteer, volunteerList, occupiedSlots, program)
  )

  const n = expanded.length
  return sortWaitingInstructorRowsUnavailableToBottom(
    expanded.map((row, idx) => ({ ...row, no: n - idx }))
  )
}

export function schoolRowToVolunteerAssignedRow(
  school: ParticipatingSchoolRow,
  volunteer: ParticipatingVolunteerRow,
  no: number,
  idx: number,
  program?: Program
): VolunteerAssignedInstitutionRow {
  const rowSeed = hash(school.id + volunteer.id)
  return {
    id: `${school.id}__assigned`,
    no,
    schoolName: school.schoolName,
    educationGrade: school.educationGrade,
    region: school.region,
    distanceFromHome: pick(ASSIGNED_DISTANCES, rowSeed + idx),
    volunteerScheduleLines: scheduleLinesForSchool(school, volunteer, program),
  }
}

export function renumberVolunteerAssignedRows(
  rows: VolunteerAssignedInstitutionRow[]
): VolunteerAssignedInstitutionRow[] {
  const n = rows.length
  return rows.map((r, i) => ({ ...r, no: n - i }))
}

export function renumberVolunteerWaitingRows(
  rows: VolunteerWaitingInstitutionRow[]
): VolunteerWaitingInstitutionRow[] {
  const sorted = sortWaitingInstructorRowsUnavailableToBottom(rows)
  const n = sorted.length
  return sorted.map((r, i) => ({ ...r, no: n - i }))
}
