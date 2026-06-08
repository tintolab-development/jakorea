/**
 * 학교 상세 정보 모달용 타입
 * 명세: docs/design/school-detail-modal-spec.md
 */

import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import type { TextbookStatusKey } from '@/data/mock/participating-schools'
import type { SettlementStatusKey } from '@/data/mock/participating-instructors'

export type InstructorRoleKey = 'lead' | 'assistant'

export interface SchoolDetailInstructorRow {
  id: string
  role: InstructorRoleKey
  instructorName: string
  contact: string
  email: string
  settlementStatus: SettlementStatusKey
}

export interface SchoolDetailForModal {
  id: string
  schoolName: string
  /** 관리자 코멘트 (신청 정보 탭 기본 정보 상단 표시) */
  adminComment?: string
  /** 일정 변경&취소 이력 횟수 (0이면 배지 미표시) */
  scheduleChangeCancelCount?: number
  region: string
  /** 상세 주소 (예: 1층 교무실 OOO 선생님 앞) */
  addressDetail?: string
  educationGrade: string
  venue?: string
  /** 교육 형태 (예: 온/오프라인) */
  educationFormat?: string
  /** 신청 총 교육시간 (숫자) */
  totalEducationHours?: number
  /** 신청 총 회차 */
  totalSessions?: number
  /** 결연 금융회사명 (미결연 등) */
  affiliatedFinancialCompany?: string
  mealProvided?: boolean
  mealNotice?: string
  teacherName?: string
  teacherPhone?: string
  teacherEmail?: string
  /** 담당 교사 휴대폰 (M) */
  teacherMobile?: string
  classCount: number
  studentCount: number
  waitingRoomAvailable?: boolean
  waitingRoomLocation?: string
  /** 강의 공간 내 컴퓨터 여부 및 안내 */
  computerInRoom?: string
  /** 주차 공간 여부 및 위치 */
  parkingInfo?: string
  /** 성범죄 경력 조회서 요청 */
  criminalCheckRequest?: string
  lectureRound: string
  textbookName?: string
  /** 교재 선택 id (참여 기관 정보 수정 mock) */
  textbookId?: string
  /** 실적 취합용 교재 학년 (합반 시 선택 교재 기준) */
  textbookGrade?: string
  /** 키트 수 (표시: n키트 (n권)용) */
  textbookKits?: number
  textbookStatus: TextbookStatusKey
  textbookQuantity?: number
  /** 전년도 참여 여부 표시 */
  previousYearParticipation?: string
  /** 신청 사유 */
  applicationReason?: string
  /** 기타 요청사항 */
  otherRequests?: string
  /** 합반 신청 여부 (일반 프로그램 참여 기관 상세) */
  combinedClassApplication?: string
  /** 합반 대상 참여 기관 id (동일 기관명·다른 학년) */
  combinedClassPartnerSchoolIds?: string[]
  /** 합반 대상 학년 표시용 */
  combinedClassPartnerGrades?: string[]
  /** 프로그램 진행 현황 라벨 (레거시 mock 호환) */
  programProgressLabel?: string
  /** 프로그램 진행 현황(7단계) — `ProgramEnrollmentStatusText`용 */
  programProgressStatus?: ProgramEnrollmentDisplayStatus
  instructors: SchoolDetailInstructorRow[]
}

/** 성별 표시용 (필터/테이블) */
export type StudentGenderKey = 'male' | 'female'

export const STUDENT_GENDER_LABELS: Record<StudentGenderKey, string> = {
  male: '남',
  female: '여',
}

export interface SchoolDetailStudentRow {
  id: string
  no: number
  name: string
  /** 성별: '남' | '여' 표시용 */
  gender?: StudentGenderKey
  /** 예: 2010. 07. 15. */
  birthDate?: string
  gradeClass: string
  contact?: string
  email?: string
  /** 강의 출석: "출석수/총회차" (예: "0/4") */
  lectureAttendance?: string
  /** 과제 제출 내역 있음 여부 */
  hasAssignmentSubmission?: boolean
  notes?: string
}

/** 학생 명단 수정 폼: useFieldArray 기준 */
export interface StudentListFormStudent {
  id: string
  no: number
  name: string
  gender?: StudentGenderKey
  birthDate: string
  gradeClass: string
  contact: string
  email: string
  lectureAttendance?: string
}

export interface StudentListFormValues {
  students: StudentListFormStudent[]
}

/** 강사진 수정 폼: useFieldArray 기준 (정산 현황은 폼에서 제외, 조회 전용) */
export interface InstructorListFormInstructor {
  id: string
  role: InstructorRoleKey
  instructorName: string
  contact: string
  email: string
}

export interface InstructorListFormValues {
  instructors: InstructorListFormInstructor[]
}

export const INSTRUCTOR_ROLE_LABELS: Record<InstructorRoleKey, string> = {
  lead: '대표 강사',
  assistant: '일반 강사',
}

/** 강의 출석 내역 모달: 회차별 출석 상태 (명세: docs/design/lecture-attendance-modal-spec.md) */
export type LectureAttendanceStatusKey = 'attended' | 'absent' | 'not_held'

export interface LectureAttendanceSession {
  roundNumber: number
  status: LectureAttendanceStatusKey
}

export interface LectureAttendanceDetail {
  studentName: string
  attendanceRatePercent: number
  sessions: LectureAttendanceSession[]
}

export const LECTURE_ATTENDANCE_STATUS_LABELS: Record<LectureAttendanceStatusKey, string> = {
  attended: '출석 완료',
  absent: '결석',
  not_held: '강의 미진행',
}

/** 과제·설문 제출 내역 모달: 팀 역할 (팀장 1명 제한은 UI에서 전환 시 처리) */
export type AssignmentTeamRoleKey = 'leader' | 'member' | 'individual'

/** 강의 진행 여부 표시 */
export type LectureProgressDisplayKey = 'completed' | 'scheduled'

/** 제출 현황 셀 표시 */
export type AssignmentSubmissionRowStatusKey =
  | 'submitted'
  | 'not_submitted'
  | 'scheduled'
  | 'none'

export interface AssignmentSubmissionTableRow {
  id: string
  roundNumber: number
  teamRole: AssignmentTeamRoleKey
  /** 팀 과제 시 팀명, 개인 역할이면 '-' */
  teamName: string
  /** 예: 2026. 01. 05 (월) | 1차시 */
  educationDateLabel: string
  /** 예: 26. 01. 01 (수) ~ 26. 01. 07 (화) */
  assignmentPeriodLabel: string
  lectureProgress: LectureProgressDisplayKey
  submissionStatus: AssignmentSubmissionRowStatusKey
  canViewAssignment: boolean
}

export interface AssignmentSubmissionDetail {
  programTitle: string
  studentName: string
  rows: AssignmentSubmissionTableRow[]
}

export const ASSIGNMENT_TEAM_ROLE_LABELS: Record<AssignmentTeamRoleKey, string> = {
  leader: '팀장',
  member: '팀원',
  individual: '개인',
}

/** 과제 제출 내역 모달 역할 드롭다운 옵션 순서 */
export const ASSIGNMENT_TEAM_ROLE_OPTIONS: readonly AssignmentTeamRoleKey[] = [
  'leader',
  'member',
  'individual',
]

export const LECTURE_PROGRESS_DISPLAY_LABELS: Record<LectureProgressDisplayKey, string> = {
  completed: '진행 완료',
  scheduled: '진행 예정',
}

export const ASSIGNMENT_SUBMISSION_ROW_STATUS_LABELS: Record<
  AssignmentSubmissionRowStatusKey,
  string
> = {
  submitted: '제출 완료',
  not_submitted: '미제출',
  scheduled: '진행 예정',
  none: '-',
}

/** 학교 상세 > 출석 관리 탭 — 회차별 출결 상태 */
export type SchoolSessionAttendanceStatusKey = 'present' | 'absent' | 'late'

export const SCHOOL_SESSION_ATTENDANCE_STATUS_LABELS: Record<
  SchoolSessionAttendanceStatusKey,
  string
> = {
  present: '출석',
  absent: '결석',
  late: '지각',
}

export const SCHOOL_ATTENDANCE_FILTER_ALL = 'all'

export interface SchoolDetailAttendanceFilters {
  educationSchedule: string
  studentName: string
  studentGender: string
  studentClass: string
  attendanceStatus: string
}

export interface SchoolDetailAttendanceStudentRow {
  id: string
  no: number
  name: string
  gender?: StudentGenderKey
  birthDate?: string
  gradeClass: string
  contact?: string
  email?: string
  status: SchoolSessionAttendanceStatusKey
}

export interface SchoolDetailAttendanceSessionGroup {
  id: string
  round: number
  /** 필터 Select value (ISO date 또는 session id) */
  filterValue: string
  /** 회차/일정 선행 라벨 (커리큘럼: 1회차·1차시, 일정형: 일정명) */
  sessionLeadLabel: string
  /** 회차 헤더 — table-title (예: 1회차 : 2026. 01. 09(금)) */
  headerTitle: string
  /** 회차 헤더 — 16px 메타 앞段 (예: 2시간 (대면)) */
  headerScheduleSummary: string
  /** 회차 헤더 — 16px 메타 뒷段 (예: 1교시 … ~ 2교시 …) */
  headerPeriodRangeLabel: string
  /** 엑셀·전체 문자열 (예: 1회차 : … 2시간 (대면) | 1교시 …) */
  headerPrefix: string
  students: SchoolDetailAttendanceStudentRow[]
}
