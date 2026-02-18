/**
 * 학교 상세 정보 모달용 Mock
 * ParticipatingSchoolRow + 확장 필드, 해당 학교 강사진, 학생 명단
 * ApplicantSchoolRow → 상세 (신청자 목록 탭용)
 */

import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-schools'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import { MOCK_PARTICIPATING_INSTRUCTORS } from '@/data/mock/participating-instructors'
import type {
  SchoolDetailForModal,
  SchoolDetailInstructorRow,
  SchoolDetailStudentRow,
  LectureAttendanceDetail,
  LectureAttendanceSession,
  LectureAttendanceStatusKey,
} from '../model/school-detail-types'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'

const TEACHER_PHONES = ['010-0000-0000', '010-1234-5678', '010-9876-5432']
const TEACHER_EMAILS = ['tinto@naver.com', 'teacher@school.kr', 'contact@edu.kr']
const VENUES = ['교육 진행 대상 학급의 교실', '학교 강당', '별도 예정']
const MEAL_NOTICES = [
  '급식실에서 식사 가능하며 해당 계좌로 인당 4,500원씩 입금 부탁드립니다. OO은행) 100-1000-10000101 김틴토',
  '미제공',
]
const WAITING_ROOMS = ['교내 1층 귀빈실', '2층 회의실', '없음']
const TEXTBOOK_NAMES = ["초등 5학년용 '우리 나라'", "초등 6학년용 '경제와 생활'", '교재 미정']
const INSTRUCTOR_PHONES = ['010-1234-5678', '010-5678-9012', '010-3456-7890']
const INSTRUCTOR_EMAILS = ['tinto@naver.com', 'tinto@naver.com', 'tinto@naver.com']

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length]
}

function toDetailInstructor(
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

  const educationGradeLabel = row.educationGrade.startsWith('초')
    ? row.educationGrade
    : `초등학교 ${row.educationGrade}`

  return {
    id: row.id,
    schoolName: row.schoolName,
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
    lectureRound: row.lectureRound,
    textbookName: pick(TEXTBOOK_NAMES, seed),
    textbookStatus: row.textbookStatus,
    textbookQuantity: row.studentCount,
    instructors,
  }
}

/**
 * 해당 학교 학생 명단 Mock (총 인원 수만큼 생성)
 */
export function getSchoolDetailStudents(schoolId: string, count: number): SchoolDetailStudentRow[] {
  const seed = hash(schoolId)
  const names = ['김학생', '이학생', '박학생', '최학생', '정학생', '강학생', '조학생', '윤학생']
  const grades = ['1반', '2반', '3반', '4반']
  const rows: SchoolDetailStudentRow[] = []
  for (let i = 0; i < count; i++) {
    const n = count - i
    rows.push({
      id: `student-${schoolId}-${i + 1}`,
      no: n,
      name: `${pick(names, seed + i)}ㅇㅇ`,
      gradeClass: pick(grades, seed + i),
      contact: i % 3 !== 0 ? '010-1234-5678' : undefined,
      email: i % 2 === 0 ? 'tinto@naver.com' : undefined,
      lectureAttendance: `${i % 5}/${4}`,
      hasAssignmentSubmission: i % 4 !== 0,
      notes: i % 5 === 0 ? '비고' : undefined,
    })
  }
  return rows
}

/**
 * 강의 출석 내역 모달용 데이터 (명세: docs/design/lecture-attendance-modal-spec.md)
 * lectureAttendance "출석수/총회차"(예: "1/4")와 학생명으로 참석률·회차별 상태 목업 생성.
 * 참석률 = (출석 완료 회차 / 강의 진행된 회차)×100, 강의 미진행은 분모·분자 제외.
 */
export function getLectureAttendanceDetail(
  student: SchoolDetailStudentRow,
  _schoolId: string
): LectureAttendanceDetail {
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
  const attendanceRatePercent = heldCount === 0 ? 0 : Math.round((attendedCount / heldCount) * 100)
  return {
    studentName: student.name,
    attendanceRatePercent,
    sessions,
  }
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

  return {
    id: row.id,
    schoolName: row.schoolName,
    scheduleChangeCancelCount: row.scheduleChangeCancelCount,
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
    textbookStatus: 'preparing',
    textbookQuantity: row.studentCount,
    instructors: [],
  }
}
