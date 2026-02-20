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
  AssignmentSubmissionDetail,
  AssignmentSubmissionSession,
  AssignmentSubmissionStatusKey,
} from '../model/school-detail-types'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'

const TEACHER_PHONES = ['010-3927-5140', '010-5218-3674', '010-7483-2915']
const TEACHER_EMAILS = ['teacher@school.kr', 'contact@edu.kr', 'admin@school.kr']
const VENUES = ['교육 진행 대상 학급의 교실', '학교 강당', '별도 예정']
const MEAL_NOTICES = [
  '급식실에서 식사 가능하며 해당 계좌로 인당 4,500원씩 입금 부탁드립니다. 농협) 352-1846-9203-71 홍채원',
  '미제공',
]
const WAITING_ROOMS = ['교내 1층 귀빈실', '2층 회의실', '없음']
const TEXTBOOK_NAMES = ["초등 5학년용 '우리 나라'", "초등 6학년용 '경제와 생활'", '교재 미정']
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
  return forSchool.map((r, i) => toDetailInstructor(r, i))
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

const STUDENT_SURNAMES = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신']
const STUDENT_GIVEN_NAMES = [
  '민준', '서연', '지우', '예린', '도현', '수아', '현우', '지은', '태민', '유리',
  '가은', '세훈', '다은', '민철', '채원', '준혁', '지원', '수진', '현아', '태양',
  '아름', '성민', '나윤', '재원', '소희', '동현', '예진', '승호', '미래', '건우',
]
const STUDENT_CONTACTS = [
  '010-2847-5913', '010-3156-8274', '010-4523-9016', '010-5781-2349',
  '010-6234-7805', '010-7845-1263', '010-8192-3746', '010-9037-6182',
]
const STUDENT_EMAILS = [
  'student01@example.com', 'student02@example.com', 'student03@example.com',
  'student04@example.com', 'student05@example.com', 'student06@example.com',
]

/**
 * 해당 학교 학생 명단 Mock (총 인원 수만큼 생성)
 */
export function getSchoolDetailStudents(schoolId: string, count: number): SchoolDetailStudentRow[] {
  const seed = hash(schoolId)
  const grades = ['1반', '2반', '3반', '4반']
  const rows: SchoolDetailStudentRow[] = []
  for (let i = 0; i < count; i++) {
    const n = count - i
    const surname = pick(STUDENT_SURNAMES, seed + i)
    const givenName = pick(STUDENT_GIVEN_NAMES, seed + i * 3 + 7)
    rows.push({
      id: `student-${schoolId}-${i + 1}`,
      no: n,
      name: `${surname}${givenName}`,
      gradeClass: pick(grades, seed + i),
      contact: i % 3 !== 0 ? pick(STUDENT_CONTACTS, seed + i) : undefined,
      email: i % 2 === 0 ? pick(STUDENT_EMAILS, seed + i) : undefined,
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
 * 과제 제출 내역 모달용 데이터
 * 학생명·제출률·회차별 상태(제출완료/미제출/강의 미진행) 목업 생성
 */
export function getAssignmentSubmissionDetail(
  student: SchoolDetailStudentRow,
  _schoolId: string
): AssignmentSubmissionDetail {
  const seed = hash(student.id)
  const totalRounds = 4
  const statuses: AssignmentSubmissionStatusKey[] = []
  for (let i = 0; i < totalRounds; i++) {
    const r = (seed + i * 7) % 3
    if (r === 0) statuses.push('submitted')
    else if (r === 1) statuses.push('not_submitted')
    else statuses.push('not_started')
  }
  const sessions: AssignmentSubmissionSession[] = statuses.map((status, i) => ({
    roundNumber: i + 1,
    status,
  }))
  const submittedCount = statuses.filter(s => s === 'submitted').length
  const heldCount = statuses.filter(s => s !== 'not_started').length
  const submissionRatePercent =
    heldCount === 0 ? 0 : Math.round((submittedCount / heldCount) * 100)
  return {
    studentName: student.name,
    submissionRatePercent,
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
