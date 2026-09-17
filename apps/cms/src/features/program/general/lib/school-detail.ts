/**
 * 학교 상세 정보 모달용 Mock
 * ParticipatingSchoolRow + 확장 필드, 해당 학교 강사진, 학생 명단
 * ApplicantSchoolRow → 상세 (신청자 목록 탭용)
 */

import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { ApplicantSchoolRow } from '@/features/program/shared/model/applicant-institution'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { countLectureAttendanceHeldAndAttended } from './lecture-attendance-count'
import { buildParticipatingSchoolPreferredScheduleLines } from './participating-school-session-display'
import type {
  SchoolDetailForModal,
  SchoolDetailInstructorRow,
  SchoolDetailStudentRow,
  LectureAttendanceDetail,
  LectureAttendanceSession,
  LectureAttendanceStatusKey,
  AssignmentSubmissionDetail,
  AssignmentTeamRoleKey,
} from '../model/school-detail-types'
import type { SettlementStatusKey } from '@/features/program/general/model/participating-instructors'
import {
  buildOccupiedWaitingInstructorScheduleSlots,
  participatingSchoolSessionToHopeSchedule,
  resolveWaitingInstructorAssignmentStatus,
  sortWaitingInstructorRowsUnavailableToBottom,
  type WaitingInstructorAssignmentStatus,
} from './waiting-instructor-assignment'
import { resolveOneSchoolPerDayAssignmentStatus } from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import type { Application } from '@/types/domain'

const INSTRUCTOR_PHONES = ['010-2847-5913', '010-4523-9016', '010-6234-7805']
const INSTRUCTOR_EMAILS = ['instructor0@example.com', 'instructor1@example.com', 'instructor2@example.com']

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

/**
 * 참여 강사 행 → 학교 상세 모달용 강사 행 (모달·테이블 연동 시 재사용)
 */
export function toDetailInstructor(
  row: ParticipatingInstructorRow,
  index: number
): SchoolDetailInstructorRow {
  const seed = hash(row.id)
  return {
    id: row.id,
    role: index === 0 ? 'lead' : 'assistant',
    instructorName: row.instructorName,
    contact: pick(INSTRUCTOR_PHONES, seed + index),
    email: pick(INSTRUCTOR_EMAILS, seed + index),
    settlementStatus: row.settlementStatus as SettlementStatusKey,
  }
}

/**
 * 참여 강사 목록에서 특정 학교 배정 강사만 추출해 모달용 강사 행 배열로 변환
 * (프로그램 진행현황 탭에서 학교 상세 모달·참여 학교 테이블 "담당 강사진" 연동용)
 */
export function getInstructorRowsForSchool(
  schoolName: string,
  instructorRows: ParticipatingInstructorRow[]
): SchoolDetailInstructorRow[] {
  const forSchool = instructorRows.filter(r => r.schoolName === schoolName)
  if (forSchool.length > 0) {
    return forSchool.map((r, i) => toDetailInstructor(r, i))
  }

  // TODO(temp-mock): 열여라 참깨 — 원격 기관 강사 배정 현황 검증 후 삭제
  const temporaryInstructors = instructorRows
    .filter(r => r.id.startsWith('temp-progress-instructor-'))
    .slice(0, 2)
  return temporaryInstructors.map((r, i) => toDetailInstructor(r, i))
}

/** 배정된 강사 목록 테이블용 확장 필드 목 데이터 */
const ASSIGNED_DISPLAY_HOME_ADDRESSES = [
  '서울특별시 강서구 방화동',
  '서울특별시 마포구 연남동',
  '서울특별시 영등포구 당산동',
  '서울특별시 서대문구 연희동',
  '서울특별시 강남구 역삼동',
  '경기도 성남시 분당구',
]
const ASSIGNED_DISPLAY_DISTANCES = ['3km', '5km', '7km', '4km', '6km', '8km']
const ASSIGNED_DISPLAY_DATES = ['2026. 01. 09(금)', '2026. 01. 10(토)', '2026. 01. 11(일)']
const ASSIGNED_DISPLAY_TIMES = [
  '1교시 (9:20 ~ 10:10)',
  '2교시 (10:20 ~ 11:10)',
  '3교시 (11:20 ~ 12:10)',
]
const ASSIGNED_DISPLAY_SESSIONS = ['1차시', '2차시', '3차시', '4차시']

/** 배정된 강사 목록 테이블용 행 (자택 주소·거리·담당 일정 등 목 데이터 연동) */
export interface AssignedInstructorDisplayRowMock extends SchoolDetailInstructorRow {
  no: number
  homeAddress?: string
  distanceToSchool?: string
  assignedDate?: string
  assignedTime?: string
  assignedSession?: string
}

export function getAssignedInstructorDisplayRows(
  instructors: SchoolDetailInstructorRow[]
): AssignedInstructorDisplayRowMock[] {
  const n = instructors.length
  return instructors.map((inv, idx) => {
    const seed = hash(inv.id)
    return {
      ...inv,
      no: n - idx,
      homeAddress: pick(ASSIGNED_DISPLAY_HOME_ADDRESSES, seed),
      distanceToSchool: pick(ASSIGNED_DISPLAY_DISTANCES, seed + idx),
      assignedDate: pick(ASSIGNED_DISPLAY_DATES, seed % 3),
      assignedTime: pick(ASSIGNED_DISPLAY_TIMES, idx % 3),
      assignedSession: pick(ASSIGNED_DISPLAY_SESSIONS, idx % 4),
    }
  })
}

/** 배정 대기 강사 목록용 희망 일정 목 데이터 */
const WAITING_HOPE_DATES = ['2026.01.09(금)', '2026.01.16(금)', '2026.01.23(금)']
const WAITING_HOPE_TIMES = ['09:20 ~ 11:20', '09:20 ~ 10:10', '10:20 ~ 11:10']
const WAITING_HOPE_SESSIONS = ['1차시', '2차시']
const WAITING_HOME_ADDRESSES = [
  '서울특별시 강남구 역삼동',
  '서울특별시 송파구 잠실동',
  '서울특별시 노원구 상계동',
  '경기도 수원시 영통구',
  '인천시 남동구',
]
const WAITING_DISTANCES = ['2km', '4km', '6km', '5km', '7km']

/** 배정 대기 강사 테이블용 행 (목 데이터) */
export interface WaitingInstructorRowMock {
  id: string
  instructorId?: string
  scheduleKey?: string
  no: number
  instructorName: string
  homeAddress?: string
  distanceToSchool?: string
  assignmentStatus: WaitingInstructorAssignmentStatus
  hopeDate?: string
  hopeTime?: string
  hopeSession?: string
  hopeScheduleLine?: string
  instructorApplicationId?: string
  instructorMemberId?: string
  requestedScheduleId?: number
  resolvedScheduleId?: number | null
  scheduleUnresolved?: boolean
}

function scheduleGroupsForWaitingInstructor(
  sessions: ParticipatingSchoolSession[] | undefined
): Array<{
  scheduleKey: string
  sessions: ParticipatingSchoolSession[]
  hopeScheduleLine: string
}> {
  const groups = new Map<string, ParticipatingSchoolSession[]>()
  for (const session of sessions?.filter(s => s.status !== 'not_planned') ?? []) {
    const scheduleKey = `${session.date}|${session.dayOfWeek}`
    const prev = groups.get(scheduleKey)
    if (prev) prev.push(session)
    else groups.set(scheduleKey, [session])
  }

  const lines = buildParticipatingSchoolPreferredScheduleLines(sessions)
  return Array.from(groups.entries()).map(([scheduleKey, group], index) => ({
    scheduleKey,
    sessions: group,
    hopeScheduleLine: lines[index] ?? '-',
  }))
}

export function getWaitingInstructorRows(
  schoolName: string,
  instructorList: ParticipatingInstructorRow[],
  schoolRows: ParticipatingSchoolRow[] = []
): WaitingInstructorRowMock[] {
  const occupiedSlots = buildOccupiedWaitingInstructorScheduleSlots(
    instructorList,
    schoolName,
    schoolRows
  )
  const currentSchool = schoolRows.find(s => s.schoolName === schoolName)
  const hopeSchedulePool =
    currentSchool?.sessions?.map(participatingSchoolSessionToHopeSchedule) ?? []

  const notAssignedToThisSchool = instructorList.filter(r => r.schoolName !== schoolName)
  const slice = notAssignedToThisSchool.slice(0, 12)
  const n = slice.length
  return sortWaitingInstructorRowsUnavailableToBottom(
    slice.map((r, idx) => {
      const seed = hash(r.id)
      const hopeFromSchool = hopeSchedulePool[idx % Math.max(hopeSchedulePool.length, 1)]
      const hopeDate = hopeFromSchool?.hopeDate ?? pick(WAITING_HOPE_DATES, idx % 3)
      const hopeTime = hopeFromSchool?.hopeTime ?? pick(WAITING_HOPE_TIMES, idx % 3)
      const hopeSession = hopeFromSchool?.hopeSession ?? pick(WAITING_HOPE_SESSIONS, idx % 2)
      const hopeSchedule = { hopeDate, hopeTime, hopeSession }
      const isTemporaryInstructor = r.id.startsWith('temp-progress-instructor-')
      return {
        id: r.id,
        no: n - idx,
        instructorName: r.instructorName,
        homeAddress: r.address ?? pick(WAITING_HOME_ADDRESSES, seed + idx),
        distanceToSchool: pick(WAITING_DISTANCES, seed % 5),
        // TODO(temp-mock): 열여라 참깨 — 배정 대기/불가 검증 후 삭제
        assignmentStatus: isTemporaryInstructor
          ? idx % 2 === 0
            ? 'waiting'
            : 'unavailable'
          : resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedSlots),
        hopeDate,
        hopeTime,
        hopeSession,
        ...(isTemporaryInstructor
          ? {
              instructorId: r.id,
              scheduleKey: `${currentSchool?.id ?? schoolName}|${idx + 1}`,
              hopeScheduleLine: `${hopeDate} | ${hopeTime} | ${hopeSession}`,
              instructorApplicationId: `996${String(idx + 1).padStart(3, '0')}`,
              instructorMemberId: r.memberId,
              requestedScheduleId: 997_000 + idx + 1,
              resolvedScheduleId: 998_000 + idx + 1,
              scheduleUnresolved: false,
            }
          : {}),
      }
    })
  )
}

/** 1사1교 — 신청 강사 + 신청 일정별 배정 대기 행 */
export function getCompanySchoolWaitingInstructorScheduleRows(
  schoolName: string,
  instructorList: ParticipatingInstructorRow[],
  schoolRows: ParticipatingSchoolRow[] = [],
  assignedInstructorIds: Set<string> = new Set(),
  /**
   * API 유도 1일1교 점유일(강사 participantId/memberId → YYYY-MM-DD).
   * 있으면 mock 슬롯 겹침 대신 날짜 충돌을 SSOT로 사용.
   */
  occupiedLectureDatesByInstructorId?: Map<string, Set<string>> | null
): WaitingInstructorRowMock[] {
  const useApiOccupiedDates = Boolean(occupiedLectureDatesByInstructorId?.size)
  const occupiedSlots = useApiOccupiedDates
    ? new Set<string>()
    : buildOccupiedWaitingInstructorScheduleSlots(instructorList, schoolName, schoolRows)
  const currentSchool = schoolRows.find(s => s.schoolName === schoolName)
  const scheduleGroups = scheduleGroupsForWaitingInstructor(currentSchool?.sessions)
  const notAssignedToThisSchool = instructorList.filter(
    r => r.schoolName !== schoolName && !assignedInstructorIds.has(r.id)
  )

  const rows: WaitingInstructorRowMock[] = []
  notAssignedToThisSchool.slice(0, 12).forEach((r, instructorIndex) => {
    const seed = hash(r.id)
    const sourceGroups =
      scheduleGroups.length > 0
        ? scheduleGroups
        : [
            {
              scheduleKey: `${r.id}|fallback`,
              sessions: [] as ParticipatingSchoolSession[],
              hopeScheduleLine: `${pick(WAITING_HOPE_DATES, instructorIndex % 3)} ${pick(
                WAITING_HOPE_TIMES,
                instructorIndex % 3
              )} | ${pick(WAITING_HOPE_SESSIONS, instructorIndex % 2)}`,
            },
          ]

    sourceGroups.forEach((group, scheduleIndex) => {
      const session = group.sessions[0]
      const hopeSchedule = session
        ? participatingSchoolSessionToHopeSchedule(session)
        : {
            hopeDate: pick(WAITING_HOPE_DATES, scheduleIndex % 3),
            hopeTime: pick(WAITING_HOPE_TIMES, scheduleIndex % 3),
            hopeSession: pick(WAITING_HOPE_SESSIONS, scheduleIndex % 2),
          }

      const assignmentStatus = useApiOccupiedDates
        ? resolveOneSchoolPerDayAssignmentStatus(
            hopeSchedule.hopeDate ?? group.hopeScheduleLine,
            occupiedLectureDatesByInstructorId?.get(r.id) ??
              (r.memberId ? occupiedLectureDatesByInstructorId?.get(r.memberId) : undefined)
          )
        : resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedSlots)

      rows.push({
        id: `${r.id}__${group.scheduleKey}`,
        instructorId: r.id,
        scheduleKey: group.scheduleKey,
        no: 0,
        instructorName: r.instructorName,
        homeAddress: r.address ?? pick(WAITING_HOME_ADDRESSES, seed + instructorIndex),
        distanceToSchool: pick(WAITING_DISTANCES, seed + scheduleIndex),
        assignmentStatus,
        hopeDate: hopeSchedule.hopeDate,
        hopeTime: hopeSchedule.hopeTime,
        hopeSession: hopeSchedule.hopeSession,
        hopeScheduleLine: group.hopeScheduleLine,
      })
    })
  })

  const sorted = sortWaitingInstructorRowsUnavailableToBottom(rows)
  const n = sorted.length
  return sorted.map((row, index) => ({ ...row, no: n - index }))
}

/**
 * 목록 행 기준으로 학교 상세 정보 생성 (확장 필드 + 해당 학교 강사진)
 */
export function getSchoolDetailByRow(row: ParticipatingSchoolRow): SchoolDetailForModal {
  const sessionCount = row.sessions?.length ?? 0
  // TODO(temp-mock): 열여라 참깨 — 참여 기관 상세 필드 검증 후 삭제
  if (row.id.startsWith('temp-textbook-status-')) {
    const textbookUsed = row.textbookStatus !== 'not_applicable'
    return {
      id: row.id,
      schoolName: row.schoolName,
      adminComment: `${row.schoolName} 진행 현황 확인용 임시 데이터`,
      scheduleChangeCancelCount: 1,
      region: row.region,
      addressDetail: '본관 1층 교무실 담당 교사 앞',
      educationGrade: row.educationGrade,
      venue: '본관 3층 경제교육실',
      educationFormat: '대면 교육',
      totalEducationHours: 8,
      totalSessions: sessionCount,
      affiliatedFinancialCompany: 'JA Korea 협력 금융사',
      mealProvided: true,
      mealNotice: '강사 식사 1식 제공',
      teacherName: row.teacherName,
      teacherPhone: '02-1234-5678',
      teacherEmail: 'teacher@school.example',
      teacherMobile: '010-1234-5678',
      classCount: row.classCount,
      studentCount: row.studentCount,
      waitingRoomAvailable: true,
      waitingRoomLocation: '본관 2층 회의실',
      computerInRoom: '강의용 노트북 및 빔프로젝터 사용 가능',
      parkingInfo: '교내 주차장 이용 가능',
      criminalCheckRequest: '교육 시작 전 조회서 제출 요청',
      lectureRound: row.lectureRound,
      textbookName: textbookUsed ? 'JA 경제교육 표준 교재' : '교재 미사용',
      textbookId: textbookUsed ? 'temp-textbook-standard' : 'temp-textbook-none',
      textbookGrade: row.educationGrade,
      textbookKits: textbookUsed ? row.classCount : 0,
      textbookStatus: row.textbookStatus,
      textbookQuantity: textbookUsed ? row.studentCount + 2 : 0,
      previousYearParticipation: '참여',
      applicationReason: '학생 경제·금융 역량 향상을 위해 신청했습니다.',
      otherRequests: '교육 시작 20분 전 도착을 요청드립니다.',
      combinedClassApplication: '미신청',
      combinedClassPartnerSchoolIds: [],
      combinedClassPartnerGrades: [],
      programProgressLabel: '교육 진행 중',
      programProgressStatus: 'EDUCATION_IN_PROGRESS',
      activityWithdrawn: false,
      activityWithdrawStopSessionKey: '',
      activityWithdrawStopScheduleLabel: '해당 없음',
      availableActions: row.availableActions,
      participationAppliedAt: '2026-09-01T09:00:00+09:00',
      instructors: [],
    }
  }
  return {
    id: row.id,
    schoolName: row.schoolName,
    region: row.region,
    educationGrade: row.educationGrade,
    teacherName: row.teacherName,
    classCount: row.classCount,
    studentCount: row.studentCount,
    lectureRound: row.lectureRound,
    textbookStatus: row.textbookStatus,
    totalSessions: sessionCount,
    activityWithdrawn: row.activityWithdrawn === true,
    availableActions: row.availableActions,
    instructors: [],
  }
}

/** 해당 학교 학생 명단 — remote API 연동 전 빈 목록 */
export function getSchoolDetailStudents(_schoolId: string, _count: number): SchoolDetailStudentRow[] {
  return []
}

function buildLectureAttendanceDetailFromSessions(
  studentName: string,
  sessions: LectureAttendanceSession[]
): LectureAttendanceDetail {
  const { attended, held } = countLectureAttendanceHeldAndAttended(sessions)
  const attendanceRatePercent = held === 0 ? 0 : Math.round((attended / held) * 100)
  return {
    studentName,
    attendanceRatePercent,
    sessions: sessions.map(s => ({ ...s })),
  }
}

/**
 * 강의 출석 내역 모달용 데이터 (명세: docs/design/lecture-attendance-modal-spec.md)
 * 학생 명단 데모는 고정 회차 상태를 우선 사용하고, 그 외는 lectureAttendance 문자열로 생성.
 */
export function getLectureAttendanceDetail(
  student: SchoolDetailStudentRow,
  _schoolId: string
): LectureAttendanceDetail {
  const [attendedStr, totalStr] = (student.lectureAttendance ?? '0/0').split('/').map(s => s.trim())
  const attendedCount = Math.max(0, parseInt(attendedStr, 10) || 0)
  const totalRounds = Math.max(0, parseInt(totalStr, 10) || 0)
  const sessions: LectureAttendanceSession[] = Array.from({ length: totalRounds }, (_, i) => ({
    roundNumber: i + 1,
    status: i < attendedCount ? ('attended' as const) : ('not_held' as const),
  }))
  return buildLectureAttendanceDetailFromSessions(student.name, sessions)
}

/** 학생 수료증 발급 판별용 회차별 출석 세션 */
export function getStudentLectureAttendanceSessions(
  student: SchoolDetailStudentRow,
  schoolId: string,
  savedSessions?: LectureAttendanceSession[]
): LectureAttendanceSession[] {
  if (savedSessions?.length) {
    return savedSessions.map(session => ({ ...session }))
  }
  return getLectureAttendanceDetail(student, schoolId).sessions
}

/** 과제·설문 제출 내역 모달: 행별 팀 역할 사용자 변경값 (row id → 역할) */
const assignmentSubmissionTeamRoleOverrides: Record<string, AssignmentTeamRoleKey> = {}

/**
 * 과제 제출 내역 테이블에서 팀 역할 변경 시 세션 패치에 반영
 * (실서비스 연동 시 동일 시그니처의 API 호출로 교체)
 */
export function updateAssignmentSubmissionTeamRole(
  rowId: string,
  role: AssignmentTeamRoleKey
): void {
  assignmentSubmissionTeamRoleOverrides[rowId] = role
}

/**
 * 과제·설문 제출 내역 모달용 데이터 (학교 상세 > 학생 명단)
 */
export function getAssignmentSubmissionDetail(
  student: SchoolDetailStudentRow,
  _schoolId: string,
  programTitle: string
): AssignmentSubmissionDetail {
  return { programTitle, studentName: student.name, rows: [] }
}

/**
 * 회원 상세 탭: Application + 회원명 기준 강의 출석 내역 모달용 데이터
 */
export function getLectureAttendanceDetailForApplication(
  application: Application,
  userName: string
): LectureAttendanceDetail {
  const raw = application.lectureAttendance ?? '0/0'
  const [attendedStr, totalStr] = raw.split('/').map(s => s.trim())
  const attendedCount = Math.max(0, parseInt(attendedStr, 10) || 0)
  const totalRounds = Math.max(1, parseInt(totalStr, 10) || 1)
  const seed = hash(application.id)
  const notHeldCount = Math.min(totalRounds - 1, seed % 3)
  const heldCount = totalRounds - notHeldCount
  const absentCount = Math.max(0, heldCount - attendedCount)
  const statuses: LectureAttendanceStatusKey[] = []
  for (let i = 0; i < attendedCount; i++) statuses.push('attended')
  for (let i = 0; i < absentCount; i++) statuses.push('absent')
  for (let i = 0; i < notHeldCount; i++) statuses.push('not_held')
  for (let i = statuses.length - 1; i >= 1; i--) {
    const j = (seed + i * 11) % (i + 1)
    ;[statuses[i], statuses[j]] = [statuses[j], statuses[i]]
  }
  const sessions: LectureAttendanceSession[] = statuses.map((status, i) => ({
    roundNumber: i + 1,
    status,
  }))
  const attendanceRatePercent = heldCount === 0 ? 0 : Math.round((attendedCount / heldCount) * 100)
  return {
    studentName: userName,
    attendanceRatePercent,
    sessions,
  }
}

/**
 * 회원 상세 탭: Application + 회원명 기준 과제·설문 제출 내역 모달용 데이터
 */
export function getAssignmentSubmissionDetailForApplication(
  _application: Application,
  userName: string,
  programTitle: string
): AssignmentSubmissionDetail {
  return { programTitle, studentName: userName, rows: [] }
}

/**
 * 신청자 목록 탭: 신청 학교 행 → 학교 상세 정보 (모달용)
 * 기본 정보만 채우고, 강사진은 빈 배열, 교재/강의 정보는 mock 기본값
 */
export function getApplicantSchoolDetail(row: ApplicantSchoolRow): SchoolDetailForModal {
  const educationGradeLabel = row.educationGrade.startsWith('초')
    ? row.educationGrade
    : `초등학교 ${row.educationGrade}`

  return {
    id: row.id,
    schoolName: row.schoolName,
    scheduleChangeCancelCount: row.scheduleChangeCancelCount,
    region: row.region,
    educationGrade: educationGradeLabel,
    teacherName: row.teacherName,
    classCount: row.classCount,
    studentCount: row.studentCount,
    lectureRound: '진행 전',
    textbookStatus: 'preparing',
    instructors: [],
  }
}
