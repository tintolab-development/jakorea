/**
 * 학교 상세 정보 모달용 Mock
 * ParticipatingSchoolRow + 확장 필드, 해당 학교 강사진, 학생 명단
 * ApplicantSchoolRow → 상세 (신청자 목록 탭용)
 */

import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { MOCK_PARTICIPATING_INSTRUCTORS } from '@/data/mock/participating-instructors'
import type {
  SchoolDetailForModal,
  SchoolDetailInstructorRow,
  SchoolDetailStudentRow,
  LectureAttendanceDetail,
  LectureAttendanceSession,
  LectureAttendanceStatusKey,
  AssignmentSubmissionDetail,
  AssignmentSubmissionTableRow,
  AssignmentTeamRoleKey,
  LectureProgressDisplayKey,
  AssignmentSubmissionRowStatusKey,
} from '../model/school-detail-types'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'
import { sortWaitingRowsAssignedToBottom } from './instructor-institution-assignment-mock'
import type { Application } from '@/types/domain'

const TEACHER_PHONES = ['010-3927-5140', '010-5218-3674', '010-7483-2915']
const TEACHER_EMAILS = ['teacher@school.kr', 'contact@edu.kr', 'admin@school.kr']
const VENUES = ['교육 진행 대상 학급의 교실', '학교 강당', '별도 예정']
const MEAL_NOTICES = [
  '급식실에서 식사 가능하며 해당 계좌로 인당 4,500원씩 입금 부탁드립니다. 농협) 352-1846-9203-71 홍채원',
  '미제공',
]
const WAITING_ROOMS = ['교내 1층 귀빈실', '2층 회의실', '없음']
const ADDRESS_DETAILS = ['1층 교무실 이길동 선생님 앞', '2층 행정실', '별도 안내']
const EDUCATION_FORMATS = ['온/오프라인', '오프라인', '온라인']
const AFFILIATED_FINANCIAL = ['미결연', 'KB국민은행', '신한은행']
const APPLICATION_REASONS = [
  '아이들의 경제감각 성장에 큰 도움이 될 것 같아 신청합니다!',
  '경제 교육 프로그램에 참여하고 싶어 신청합니다.',
]
const OTHER_REQUESTS = [
  '혹시 다른 학년도 동일하게 추가 신청이 가능할까요?',
  '없습니다.',
]

/** 관리자 코멘트 목업 (빈 문자열 = 미등록) */
const ADMIN_COMMENTS = [
  '정산 계좌 정보 재확인 필요. 입금자명이 다르네요.',
  '다음 주까지 강사진 명단 확정 요청드립니다.',
  '',
  '교재 배송지 주소 변경 요청이 접수되었습니다. 배송 전 확인 부탁드립니다.',
]
const PREVIOUS_YEAR = ['참여 X', '참여 O']
const COMPUTER_IN_ROOM = ['1대 사용 가능 | USB 사용 불가', '2대 사용 가능', '없음']
const PARKING_INFO = ['있음 | 학교 정문 앞 주차장 사용 가능', '있음 | 후문 주차장', '없음']
const CRIMINAL_CHECK = ['온라인 제출 요청', '제출 완료', '미요청']
const TEXTBOOK_NAMES = ["초등 5학년용 '우리 나라'", "초등 6학년용 '경제와 생활'", '성공하는 경제생활', '교재 미정']
const TEXTBOOK_KITS = [4, 6, 8]
const TEXTBOOK_QUANTITIES = [96, 144, 192]
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
  const rows = forSchool.map((r, i) => toDetailInstructor(r, i))
  /** 배정된 강사 목록 데모: 정산 대기 1건 → 일부 정산 완료 */
  const firstPendingIdx = rows.findIndex(r => r.settlementStatus === 'pending')
  if (firstPendingIdx < 0) return rows
  return rows.map((r, i) =>
    i === firstPendingIdx ? { ...r, settlementStatus: 'partial' satisfies SettlementStatusKey } : r
  )
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

/** 배정 대기 강사 목록용 배정 현황·희망 일정 목 데이터 */
/** 배정 대기 목록 목업: 일부는 배정 완료(다른 기관 배정 등)로 표시 */
const WAITING_ASSIGNMENT_STATUSES = [
  'waiting',
  'assigned',
  'waiting',
  'assigned',
  'cancelled',
  'assigned',
  'waiting',
] as const
const WAITING_HOPE_DATES = ['2026. 01. 10(토)', '2026. 01. 11(일)', '2026. 01. 12(일)']
const WAITING_HOPE_TIMES = [
  '1교시 (9:20 ~ 10:10)',
  '2교시 (10:20 ~ 11:10)',
  '3교시 (11:20 ~ 12:10)',
]
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
  no: number
  instructorName: string
  homeAddress?: string
  distanceToSchool?: string
  assignmentStatus: 'waiting' | 'cancelled' | 'assigned'
  hopeDate?: string
  hopeTime?: string
  hopeSession?: string
}

export function getWaitingInstructorRows(
  schoolName: string,
  instructorList: ParticipatingInstructorRow[]
): WaitingInstructorRowMock[] {
  const notAssignedToThisSchool = instructorList.filter(r => r.schoolName !== schoolName)
  const slice = notAssignedToThisSchool.slice(0, 12)
  const n = slice.length
  return sortWaitingRowsAssignedToBottom(
    slice.map((r, idx) => {
      const seed = hash(r.id)
      return {
        id: r.id,
        no: n - idx,
        instructorName: r.instructorName,
        homeAddress: r.address ?? pick(WAITING_HOME_ADDRESSES, seed + idx),
        distanceToSchool: pick(WAITING_DISTANCES, seed % 5),
        assignmentStatus: pick([...WAITING_ASSIGNMENT_STATUSES], seed + idx),
        hopeDate: pick(WAITING_HOPE_DATES, idx % 3),
        hopeTime: pick(WAITING_HOPE_TIMES, idx % 3),
        hopeSession: pick(WAITING_HOPE_SESSIONS, idx % 2),
      }
    })
  )
}

/**
 * 목록 행 기준으로 학교 상세 정보 생성 (확장 필드 + 해당 학교 강사진)
 */
export function getSchoolDetailByRow(row: ParticipatingSchoolRow): SchoolDetailForModal {
  const seed = hash(row.id)
  const instructorsForSchool = MOCK_PARTICIPATING_INSTRUCTORS.filter(
    r => r.schoolName === row.schoolName
  ).slice(0, 5)
  const instructors: SchoolDetailInstructorRow[] = instructorsForSchool.map((r, i) =>
    toDetailInstructor(r, i)
  )

  const sessionCount = row.sessions?.length ?? 2
  const adminCommentRaw = pick(ADMIN_COMMENTS, seed)
  const isJinwolDemo = row.schoolName === '진월초등학교'
  const isGangseoFiveGrade =
    row.schoolName === '강서초등학교' && row.educationGrade === '5학년'
  const combinedClassApplication = isJinwolDemo
    ? '미신청'
    : isGangseoFiveGrade
      ? '신청'
      : seed % 4 === 0
        ? '신청'
        : '미신청'
  return {
    id: row.id,
    schoolName: row.schoolName,
    adminComment: adminCommentRaw.trim() ? adminCommentRaw : undefined,
    region: isJinwolDemo ? '광주광역시 남구 광복마을4길 40' : row.region,
    addressDetail: isJinwolDemo ? '1층 교무실 이길동 선생님 앞' : pick(ADDRESS_DETAILS, seed),
    educationGrade: row.educationGrade,
    combinedClassApplication,
    combinedClassPartnerSchoolIds: isGangseoFiveGrade ? ['school-2'] : undefined,
    combinedClassPartnerGrades: isGangseoFiveGrade ? ['3학년'] : undefined,
    programProgressLabel: '프로그램 진행 중',
    programProgressStatus: 'EDUCATION_IN_PROGRESS',
    venue: pick(VENUES, seed),
    educationFormat: isJinwolDemo ? '온/오프라인' : pick(EDUCATION_FORMATS, seed),
    totalEducationHours: 2,
    totalSessions: sessionCount,
    affiliatedFinancialCompany: pick(AFFILIATED_FINANCIAL, seed),
    mealProvided: isJinwolDemo ? true : seed % 3 !== 0,
    mealNotice: isJinwolDemo ? '가능' : pick(MEAL_NOTICES, seed),
    teacherName: isJinwolDemo ? '이길동' : row.teacherName,
    teacherPhone: isJinwolDemo ? '062-1234-0000' : pick(TEACHER_PHONES, seed),
    teacherEmail: isJinwolDemo ? 'tinto@naver.com' : pick(TEACHER_EMAILS, seed),
    teacherMobile: isJinwolDemo ? '010-1234-5678' : pick(TEACHER_PHONES, seed + 1),
    classCount: row.classCount,
    studentCount: row.studentCount,
    waitingRoomAvailable: isJinwolDemo ? true : seed % 2 === 0,
    waitingRoomLocation: isJinwolDemo
      ? '후관2층 1-4 옆 강사대기실(늘봄교실1)에서 대기, 정수기는 후관2층 2학년 연구실 이용하시면 됩니다.'
      : pick(WAITING_ROOMS, seed),
    computerInRoom: isJinwolDemo
      ? '1대 사용 가능, USB는 사용 불가합니다.'
      : pick(COMPUTER_IN_ROOM, seed),
    parkingInfo: isJinwolDemo
      ? "본교 주차장이 협소한 관계로 학교 바로 옆 '운남동 공영주차장' 이용 부탁드립니다."
      : pick(PARKING_INFO, seed),
    criminalCheckRequest: isJinwolDemo
      ? '온라인 제출 | ID : tinto | 검증번호 : 940412'
      : pick(CRIMINAL_CHECK, seed),
    lectureRound: row.lectureRound,
    textbookName:
      row.schoolName === '진월초등학교' ? '성공하는 경제생활' : pick(TEXTBOOK_NAMES, seed),
    textbookKits: row.schoolName === '진월초등학교' ? 6 : pick(TEXTBOOK_KITS, seed),
    textbookStatus: row.textbookStatus,
    textbookQuantity: row.schoolName === '진월초등학교' ? 144 : pick(TEXTBOOK_QUANTITIES, seed),
    previousYearParticipation: pick(PREVIOUS_YEAR, seed),
    applicationReason: isJinwolDemo
      ? '아이들의 경제감각 성장에 큰 도움이 될 것 같아 신청합니다!'
      : pick(APPLICATION_REASONS, seed),
    otherRequests: isJinwolDemo
      ? '혹시 다른 학년도 동일하게 추가 신청이 가능할까요?'
      : pick(OTHER_REQUESTS, seed),
    instructors,
  }
}

/** 학교 상세 > 학생 명단 탭 목업 (8건 고정) */
const SCHOOL_DETAIL_STUDENT_LIST_MOCK: ReadonlyArray<
  Omit<SchoolDetailStudentRow, 'id'>
> = [
  {
    no: 8,
    name: '김학생',
    gender: 'female',
    birthDate: '2010. 07. 15.',
    gradeClass: '1반',
    contact: '010-1234-5678',
    email: 'haksaeng@gmail.com',
    lectureAttendance: '1/4',
  },
  {
    no: 7,
    name: '이학생',
    gender: 'male',
    birthDate: '2010. 08. 22.',
    gradeClass: '2반',
    contact: '010-1234-5678',
    email: 'haksaeng@gmail.com',
    lectureAttendance: '2/4',
  },
  {
    no: 6,
    name: '박학생',
    gender: 'female',
    birthDate: '2010. 09. 03.',
    gradeClass: '3반',
    contact: undefined,
    email: 'haksaeng@gmail.com',
    lectureAttendance: '1/4',
  },
  {
    no: 5,
    name: '최학생',
    gender: 'male',
    birthDate: '2010. 10. 11.',
    gradeClass: '4반',
    contact: '010-1234-5678',
    email: undefined,
    lectureAttendance: '2/4',
  },
  {
    no: 4,
    name: '정학생',
    gender: 'female',
    birthDate: '2010. 11. 27.',
    gradeClass: '1반',
    contact: '010-1234-5678',
    email: 'haksaeng@gmail.com',
    lectureAttendance: '1/4',
  },
  {
    no: 3,
    name: '강학생',
    gender: 'male',
    birthDate: '2010. 12. 05.',
    gradeClass: '2반',
    contact: undefined,
    email: undefined,
    lectureAttendance: '2/4',
  },
  {
    no: 2,
    name: '조학생',
    gender: 'female',
    birthDate: '2011. 01. 14.',
    gradeClass: '3반',
    contact: '010-1234-5678',
    email: 'haksaeng@gmail.com',
    lectureAttendance: '1/4',
  },
  {
    no: 1,
    name: '윤학생',
    gender: 'male',
    birthDate: '2011. 02. 28.',
    gradeClass: '4반',
    contact: '010-1234-5678',
    email: 'haksaeng@gmail.com',
    lectureAttendance: '2/4',
  },
]

/**
 * 해당 학교 학생 명단 Mock (데모 8건)
 */
export function getSchoolDetailStudents(schoolId: string, _count: number): SchoolDetailStudentRow[] {
  return SCHOOL_DETAIL_STUDENT_LIST_MOCK.map((row, i) => ({
    ...row,
    id: `student-${schoolId}-${i + 1}`,
  }))
}

/** 학생 명단 데모 — `LectureAttendanceModal` 회차별 상태 (스크린샷 시안 정렬) */
const LECTURE_ATTENDANCE_SESSIONS_BY_STUDENT_NAME: Readonly<
  Record<string, readonly LectureAttendanceSession[]>
> = {
  김학생: [
    { roundNumber: 1, status: 'attended' },
    { roundNumber: 2, status: 'not_held' },
    { roundNumber: 3, status: 'not_held' },
    { roundNumber: 4, status: 'not_held' },
  ],
  이학생: [
    { roundNumber: 1, status: 'attended' },
    { roundNumber: 2, status: 'attended' },
    { roundNumber: 3, status: 'not_held' },
    { roundNumber: 4, status: 'not_held' },
  ],
  박학생: [
    { roundNumber: 1, status: 'attended' },
    { roundNumber: 2, status: 'not_held' },
    { roundNumber: 3, status: 'not_held' },
    { roundNumber: 4, status: 'not_held' },
  ],
  최학생: [
    { roundNumber: 1, status: 'attended' },
    { roundNumber: 2, status: 'absent' },
    { roundNumber: 3, status: 'not_held' },
    { roundNumber: 4, status: 'not_held' },
  ],
  정학생: [
    { roundNumber: 1, status: 'attended' },
    { roundNumber: 2, status: 'not_held' },
    { roundNumber: 3, status: 'not_held' },
    { roundNumber: 4, status: 'not_held' },
  ],
  강학생: [
    { roundNumber: 1, status: 'attended' },
    { roundNumber: 2, status: 'absent' },
    { roundNumber: 3, status: 'not_held' },
    { roundNumber: 4, status: 'not_held' },
  ],
  조학생: [
    { roundNumber: 1, status: 'attended' },
    { roundNumber: 2, status: 'not_held' },
    { roundNumber: 3, status: 'not_held' },
    { roundNumber: 4, status: 'not_held' },
  ],
  윤학생: [
    { roundNumber: 1, status: 'attended' },
    { roundNumber: 2, status: 'attended' },
    { roundNumber: 3, status: 'not_held' },
    { roundNumber: 4, status: 'not_held' },
  ],
}

function buildLectureAttendanceDetailFromSessions(
  studentName: string,
  sessions: LectureAttendanceSession[]
): LectureAttendanceDetail {
  const held = sessions.filter(s => s.status !== 'not_held').length
  const attended = sessions.filter(s => s.status === 'attended').length
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
  const fixed = LECTURE_ATTENDANCE_SESSIONS_BY_STUDENT_NAME[student.name]
  if (fixed) {
    return buildLectureAttendanceDetailFromSessions(student.name, [...fixed])
  }

  const [attendedStr, totalStr] = (student.lectureAttendance ?? '0/0').split('/').map(s => s.trim())
  const attendedCount = Math.max(0, parseInt(attendedStr, 10) || 0)
  const totalRounds = Math.max(1, parseInt(totalStr, 10) || 1)
  const seed = hash(student.id)
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
  return buildLectureAttendanceDetailFromSessions(student.name, sessions)
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function formatEducationLine(date: Date, round: number): string {
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  const w = WEEKDAY_KO[date.getDay()] ?? ''
  return `${y}. ${m}. ${d} (${w}) | ${round}차시`
}

/** 마지막 행 스크린샷 정렬: 강의 평가 차시 */
function formatEducationEvaluationLine(date: Date): string {
  const y = date.getFullYear()
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  const w = WEEKDAY_KO[date.getDay()] ?? ''
  return `${y}. ${m}. ${d} (${w}) | 강의 평가`
}

function formatShortYmdWithWeekday(date: Date): string {
  const yy = String(date.getFullYear()).slice(-2)
  const m = pad2(date.getMonth() + 1)
  const d = pad2(date.getDate())
  const w = WEEKDAY_KO[date.getDay()] ?? ''
  return `${yy}. ${m}. ${d} (${w})`
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

/** 과제·설문 제출 내역 모달: 행별 팀 역할 사용자 변경값 (row id → 역할) */
const assignmentSubmissionTeamRoleOverrides: Record<string, AssignmentTeamRoleKey> = {}

/**
 * 과제 제출 내역 테이블에서 팀 역할 변경 시 mock 데이터에 반영
 * (실서비스 연동 시 동일 시그니처의 API 호출로 교체)
 */
export function updateAssignmentSubmissionTeamRole(
  rowId: string,
  role: AssignmentTeamRoleKey
): void {
  assignmentSubmissionTeamRoleOverrides[rowId] = role
}

function buildAssignmentSubmissionRows(
  entityId: string,
  studentName: string,
  programTitle: string
): AssignmentSubmissionDetail {
  const seed = hash(entityId)
  const baseSessionDate = new Date(2026, 0, 5)
  const count = 4
  const rolePattern: AssignmentTeamRoleKey[] = ['leader', 'member', 'member', 'individual']
  const roleOffset = seed % count
  const sharedTeamName = `${(seed % 4) + 1}조`
  const rows: AssignmentSubmissionTableRow[] = []
  for (let i = 0; i < count; i++) {
    const r = (seed + i * 13) % 5
    let lecture: LectureProgressDisplayKey
    let submission: AssignmentSubmissionRowStatusKey
    let canView: boolean
    if (r === 0) {
      lecture = 'completed'
      submission = 'submitted'
      canView = true
    } else if (r === 1) {
      lecture = 'completed'
      submission = 'none'
      canView = false
    } else if (r === 2) {
      lecture = 'scheduled'
      submission = 'not_submitted'
      canView = false
    } else if (r === 3) {
      lecture = 'scheduled'
      submission = 'scheduled'
      canView = false
    } else {
      lecture = 'completed'
      submission = 'scheduled'
      canView = false
    }
    const sessionDate = addDays(baseSessionDate, i * 7)
    const periodStart = addDays(sessionDate, -4)
    const periodEnd = addDays(sessionDate, -1)
    const isLastEvaluationRow = i === count - 1
    const rowId = `${entityId}-assignment-row-${i}`
    const defaultRole = rolePattern[(i + roleOffset) % rolePattern.length]!
    const effectiveRole = assignmentSubmissionTeamRoleOverrides[rowId] ?? defaultRole
    rows.push({
      id: rowId,
      roundNumber: i + 1,
      teamRole: effectiveRole,
      teamName: effectiveRole === 'individual' ? '-' : sharedTeamName,
      educationDateLabel: isLastEvaluationRow
        ? formatEducationEvaluationLine(sessionDate)
        : formatEducationLine(sessionDate, i + 1),
      assignmentPeriodLabel: isLastEvaluationRow
        ? '-'
        : `${formatShortYmdWithWeekday(periodStart)} ~ ${formatShortYmdWithWeekday(periodEnd)}`,
      lectureProgress: lecture,
      submissionStatus: submission,
      canViewAssignment: canView,
    })
  }
  return {
    programTitle,
    studentName,
    rows,
  }
}

/**
 * 과제·설문 제출 내역 모달용 데이터 (학교 상세 > 학생 명단)
 */
export function getAssignmentSubmissionDetail(
  student: SchoolDetailStudentRow,
  _schoolId: string,
  programTitle: string
): AssignmentSubmissionDetail {
  return buildAssignmentSubmissionRows(student.id, student.name, programTitle)
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
  application: Application,
  userName: string,
  programTitle: string
): AssignmentSubmissionDetail {
  return buildAssignmentSubmissionRows(application.id, userName, programTitle)
}

/**
 * 신청자 목록 탭: 신청 학교 행 → 학교 상세 정보 (모달용)
 * 기본 정보만 채우고, 강사진은 빈 배열, 교재/강의 정보는 mock 기본값
 */
export function getApplicantSchoolDetail(row: ApplicantSchoolRow): SchoolDetailForModal {
  const seed = hash(row.id)
  const educationGradeLabel = row.educationGrade.startsWith('초')
    ? row.educationGrade
    : `초등학교 ${row.educationGrade}`

  const adminCommentRaw = pick(ADMIN_COMMENTS, seed)
  return {
    id: row.id,
    schoolName: row.schoolName,
    scheduleChangeCancelCount: row.scheduleChangeCancelCount,
    adminComment: adminCommentRaw.trim() ? adminCommentRaw : undefined,
    region: row.region,
    educationGrade: educationGradeLabel,
    venue: pick(VENUES, seed),
    mealProvided: seed % 3 !== 0,
    mealNotice: pick(MEAL_NOTICES, seed),
    teacherName: row.teacherName,
    teacherPhone: pick(TEACHER_PHONES, seed),
    teacherEmail: pick(TEACHER_EMAILS, seed),
    classCount: row.classCount,
    studentCount: row.studentCount,
    waitingRoomAvailable: seed % 2 === 0,
    waitingRoomLocation: pick(WAITING_ROOMS, seed),
    lectureRound: '진행 전',
    textbookName: pick(TEXTBOOK_NAMES, seed),
    textbookKits: pick(TEXTBOOK_KITS, seed),
    textbookStatus: 'preparing',
    textbookQuantity: pick(TEXTBOOK_QUANTITIES, seed),
    instructors: [],
  }
}
