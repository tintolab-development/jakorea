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
  SchoolSessionAttendanceStatusKey,
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
import {
  formatApplicantGradeLabel,
  formatPreviousYearParticipationLabel,
  formatRequestedEducationFormat,
} from '@/features/program/general/api/adapters/general-applications-adapters'
import type { OrganizationApplicationDetailResponse } from '@/shared/api/generated/dashboard/schemas/organizationApplicationDetailResponse'

function readFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

/** 기관 상세 GET의 키트/권수. 최상위 필드와 nested textbook.kits|quantity를 모두 읽는다. 목록 캐시로 채우지 않는다. */
export function readOrganizationTextbookKitFields(
  dto: OrganizationApplicationDetailResponse
): { textbookKits?: number; textbookQuantity?: number } {
  const nested = (
    dto as OrganizationApplicationDetailResponse & {
      textbook?: { kits?: unknown; quantity?: unknown }
    }
  ).textbook
  return {
    textbookKits: readFiniteNumber(dto.textbookKits) ?? readFiniteNumber(nested?.kits),
    textbookQuantity: readFiniteNumber(dto.textbookQuantity) ?? readFiniteNumber(nested?.quantity),
  }
}

/**
 * 참여 강사 행 → 학교 상세 모달용 강사 행 (모달·테이블 연동 시 재사용)
 */
export function toDetailInstructor(
  row: ParticipatingInstructorRow,
  index: number
): SchoolDetailInstructorRow {
  return {
    id: row.id,
    role: index === 0 ? 'lead' : 'assistant',
    instructorName: row.instructorName,
    contact: row.contact?.trim() || '-',
    email: row.email?.trim() || '-',
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
  return []
}

/** 배정된 강사 목록 테이블용 행 */
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
  return instructors.map((inv, idx) => ({
    ...inv,
    no: n - idx,
    homeAddress: '-',
    distanceToSchool: '-',
    assignedDate: '-',
    assignedTime: '-',
    assignedSession: '-',
  }))
}

/** 배정 대기 강사 테이블용 행 */
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
      const hopeFromSchool = hopeSchedulePool[idx % Math.max(hopeSchedulePool.length, 1)]
      const hopeDate = hopeFromSchool?.hopeDate ?? '-'
      const hopeTime = hopeFromSchool?.hopeTime ?? '-'
      const hopeSession = hopeFromSchool?.hopeSession ?? '-'
      const hopeSchedule = { hopeDate, hopeTime, hopeSession }
      return {
        id: r.id,
        no: n - idx,
        instructorName: r.instructorName,
        homeAddress: r.address?.trim() || '-',
        distanceToSchool: '-',
        assignmentStatus: resolveWaitingInstructorAssignmentStatus(hopeSchedule, occupiedSlots),
        hopeDate,
        hopeTime,
        hopeSession,
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
  notAssignedToThisSchool.slice(0, 12).forEach(r => {
    if (scheduleGroups.length === 0) return

    scheduleGroups.forEach(group => {
      const session = group.sessions[0]
      if (!session) return
      const hopeSchedule = participatingSchoolSessionToHopeSchedule(session)

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
        homeAddress: r.address?.trim() || '-',
        distanceToSchool: '-',
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
  return {
    id: row.id,
    schoolName: row.schoolName,
    region: row.region,
    educationGrade: row.educationGrade,
    teacherName: row.teacherName,
    teacherPhone: row.teacherPhone,
    teacherMobile: row.teacherMobile ?? row.contact,
    teacherEmail: row.teacherEmail,
    classCount: row.classCount,
    studentCount: row.studentCount,
    lectureRound: row.lectureRound,
    textbookStatus: row.textbookStatus,
    textbookName: row.textbookName,
    textbookId: row.textbookId,
    textbookKits: row.textbookKits,
    textbookQuantity: row.textbookQuantity,
    addressDetail: row.addressDetail,
    educationFormat: row.educationFormat,
    applicationReason: row.applicationReason,
    otherRequests: row.otherRequests,
    totalSessions: sessionCount,
    activityWithdrawn: row.activityWithdrawn === true,
    availableActions: row.availableActions,
    instructors: [],
  }
}

export function mergeOrganizationApplicationDetailOntoSchoolDetail(
  detail: SchoolDetailForModal,
  dto: OrganizationApplicationDetailResponse
): SchoolDetailForModal {
  const stringField = (key: keyof OrganizationApplicationDetailResponse) => {
    const value = dto[key]
    if (typeof value !== 'string') return undefined
    const trimmed = value.trim()
    return trimmed || undefined
  }
  const numberField = (key: keyof OrganizationApplicationDetailResponse) => {
    const value = dto[key]
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined
  }
  const teacherTel = stringField('teacherTel')
  const teacherMobile = stringField('teacherPhone')
  const teacherEmail = stringField('teacherEmail')
  const addressDetail = stringField('organizationAddressDetail')
  const educationFormat = formatRequestedEducationFormat(dto.requestedEducationFormat)
  const requestedGrade = stringField('requestedGrade')
  const organizationName = stringField('organizationName')
  const organizationAddress = stringField('organizationAddress')
  const teacherName = stringField('teacherName')
  const applicationReason = stringField('applicationReason')
  const otherRequests = stringField('otherRequests')
  const computerInRoom = stringField('computerInRoom')
  const waitingRoomLocation = stringField('waitingRoomLocation')
  const mealNotice = stringField('mealNotice')
  const parkingInfo = stringField('parkingInfo')
  const textbookName = stringField('textbookName')
  const textbookGrade = stringField('textbookGrade')
  const economyFields = {
    previousYearParticipation: formatPreviousYearParticipationLabel(
      dto.previousYearParticipation
    ),
    affiliatedFinancialCompany: stringField('affiliatedFinancialCompany'),
  }
  return {
    ...detail,
    schoolName: organizationName ?? '-',
    region: organizationAddress ?? '-',
    addressDetail,
    educationGrade: formatApplicantGradeLabel(requestedGrade) || '-',
    educationFormat: educationFormat || undefined,
    classCount: numberField('requestedClassCount') ?? 0,
    studentCount: numberField('requestedStudentCount') ?? 0,
    teacherName,
    teacherPhone: teacherTel,
    teacherMobile,
    teacherEmail,
    applicationReason,
    otherRequests,
    computerInRoom,
    waitingRoomLocation,
    mealProvided: dto.mealProvided ?? undefined,
    mealNotice,
    parkingInfo,
    textbookId: dto.textbookId != null ? String(dto.textbookId) : undefined,
    textbookName,
    textbookGrade,
    ...readOrganizationTextbookKitFields(dto),
    waitingRoomAvailable: dto.waitingRoomAvailable ?? undefined,
    participationAppliedAt: dto.submittedAt ?? undefined,
    gradeBlocks: dto.gradeBlocks ?? undefined,
    ...economyFields,
  }
}

/** FE mock 학생 — 회차별 출석 관리 상태 */
export function resolveTemporaryStudentSessionAttendanceStatus(
  _studentId: string,
  _roundNumber: number
): SchoolSessionAttendanceStatusKey {
  return 'present'
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
  const totalRounds = Math.max(0, parseInt(totalStr, 10) || 0)
  const heldCount = Math.max(attendedCount, totalRounds)
  const absentCount = Math.max(0, heldCount - attendedCount)
  const statuses: LectureAttendanceStatusKey[] = []
  for (let i = 0; i < attendedCount; i++) statuses.push('attended')
  for (let i = 0; i < absentCount; i++) statuses.push('absent')
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
  const educationGradeLabel =
    /^(초|중|고)/.test(row.educationGrade.trim()) || row.educationGrade.includes('학교')
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
    addressDetail: row.detail?.addressDetail,
    educationFormat: row.detail?.educationType,
    textbookName: row.detail?.textbookName,
    teacherEmail: row.contact,
    teacherPhone: row.contact,
    applicationReason: row.detail?.applicationReason,
    computerInRoom: row.detail?.computerInSpace,
    waitingRoomLocation: row.detail?.waitingPlaceGuide,
    mealNotice: row.detail?.mealInfo,
    adminComment: row.adminComment,
  }
}
