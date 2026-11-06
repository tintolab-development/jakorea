/**
 * 학교 상세 정보 모달용 타입
 * 명세: docs/design/school-detail-modal-spec.md
 */

import type { GradeBlock } from '@/shared/api/generated/dashboard/schemas/gradeBlock'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import type { TextbookStatusKey } from '@/features/program/general/model/participating-schools'
import type { SettlementStatusKey } from '@/features/program/general/model/participating-instructors'
import type { StudentPortraitConsentSubmission } from '../lib/student-portrait-consent'

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
  /** 성범죄경력 조회서 요청 */
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
  /** 활동 포기 처리 여부 */
  activityWithdrawn?: boolean
  /** 활동 포기 기준 교육 일정 키 (`buildParticipatingSchoolSessionKey`) */
  activityWithdrawStopSessionKey?: string
  /** 활동 포기 기준 교육 일정 표시 라벨 */
  activityWithdrawStopScheduleLabel?: string
  /** BE participant availableActions — 상세 포기 버튼 게이트 */
  availableActions?: string[]
  /** 프로그램 참여 신청일 — 수료증/참가인증서 발급 가능 기한(3년) 산정 기준 */
  participationAppliedAt?: string
  /** 기관 신청 상세 `gradeBlocks` — 등록 학년·학급 SSOT */
  gradeBlocks?: GradeBlock[] | null
  instructors: SchoolDetailInstructorRow[]
}

/** 성별 표시용 (필터/테이블) */
export type StudentGenderKey = 'male' | 'female'

export const STUDENT_GENDER_LABELS: Record<StudentGenderKey, string> = {
  male: '남',
  female: '여',
}

/** 학생 명단·출석 성별. 남/여는 한글, 마스킹 값은 서버 원문. */
export function formatStudentGenderLabel(
  gender?: StudentGenderKey | null,
  genderMask?: string | null,
  empty = '-'
): string {
  if (gender && STUDENT_GENDER_LABELS[gender]) return STUDENT_GENDER_LABELS[gender]
  const mask = genderMask?.trim()
  if (mask) return mask
  return empty
}

export interface SchoolDetailStudentRow {
  /** 화면 행 키. 서버 학생 식별자가 아니다. */
  id: string
  /**
   * GET 학생명단의 rosterId. 이 값이 있을 때만 PUT에 rosterId를 보낸다.
   * 신규 행·임시 id에는 두지 않는다.
   */
  serverRosterId?: number
  /** BE 회원 ID — 참여자 PK와 구분 */
  memberId?: number
  /** 진행 출석 API용 participant PK */
  participantId?: number
  no: number
  name: string
  /** 성별: '남' | '여' 표시용. 마스킹 값은 `genderMask`. */
  gender?: StudentGenderKey
  /** 조회 응답 성별이 `*`처럼 마스킹된 경우 원문 그대로 */
  genderMask?: string
  /** 예: 2010. 07. 15. */
  birthDate?: string
  gradeClass: string
  contact?: string
  email?: string
  /** 강의 출석: "출석수/총회차" (예: "0/4") */
  lectureAttendance?: string
  /** 교사 제출 초상권 동의서 (`agreement-portrait` 연동) */
  portraitConsentSubmission?: StudentPortraitConsentSubmission | null
  /** 관리자 파일 fileObjectId — 있으면 downloadAdminFile. artifact id가 아니다. */
  portraitConsentFileObjectId?: number
  /** 학생 만족도조사 제출 완료 여부 (프로그램에 만족도 조사가 있을 때 수료 판별에 사용) */
  satisfactionSurveyCompleted?: boolean
  /** 과제 제출 내역 있음 여부 */
  hasAssignmentSubmission?: boolean
  notes?: string
}

/** 학생 명단 수정 폼: useFieldArray 기준 */
export interface StudentListFormStudent {
  id: string
  /** 편집 폼을 거쳐도 유지하는 서버 rosterId. 신규 행에는 없다. */
  serverRosterId?: number
  no: number
  name: string
  gender?: StudentGenderKey
  birthDate: string
  gradeClass: string
  contact: string
  email: string
  notes: string
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
export type LectureAttendanceStatusKey = 'attended' | 'absent' | 'late' | 'not_held'

export interface LectureAttendanceSession {
  roundNumber: number
  status: LectureAttendanceStatusKey
  /** 진행 출석 정정용 schedule PK */
  scheduleId?: number
  /**
   * 강의 시작 시각이 지나 출석을 기록할 수 있는 회차.
   * 기록이 없어도 정정 모드에서 출석/결석/지각을 고를 수 있다.
   */
  recordingOpen?: boolean
  /**
   * 필수 사전교육 일정(scheduleRole=PRE_EDUCATION). 라벨은 「사전교육」, roundNumber는 0(회차 아님).
   * 출석률 분모에는 다른 교육 일정과 같이 포함한다.
   */
  preEducation?: boolean
}

export interface LectureAttendanceDetail {
  studentName: string
  attendanceRatePercent: number
  sessions: LectureAttendanceSession[]
}

export const LECTURE_ATTENDANCE_STATUS_LABELS: Record<LectureAttendanceStatusKey, string> = {
  attended: '출석',
  absent: '결석',
  late: '지각',
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
  /** REQ-010 — BE `submissionFileIds[]` 연동 시 단건 download */
  submissionFileIds?: number[]
  /** Wave11 POST feedback — form response id (없으면 CTA 비노출) */
  formResponseId?: number
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
export type SchoolSessionAttendanceEditableStatusKey = 'present' | 'absent' | 'late'

export type SchoolSessionAttendanceStatusKey =
  | SchoolSessionAttendanceEditableStatusKey
  | 'excused'
  | 'unrecorded'

export const SCHOOL_SESSION_ATTENDANCE_EDITABLE_STATUS_KEYS = [
  'present',
  'absent',
  'late',
] as const satisfies readonly SchoolSessionAttendanceEditableStatusKey[]

export const SCHOOL_SESSION_ATTENDANCE_STATUS_LABELS: Record<
  SchoolSessionAttendanceStatusKey,
  string
> = {
  present: '출석',
  absent: '결석',
  late: '지각',
  excused: '사유 불참',
  unrecorded: '미기록',
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
  /** 조회 성별이 `*`처럼 마스킹된 경우 원문 */
  genderMask?: string
  birthDate?: string
  gradeClass: string
  contact?: string
  email?: string
  status: SchoolSessionAttendanceStatusKey
  /** 서버 원본 출결 코드. 화면 편집값(`status`)과 분리한다. */
  recordedApiStatus?: string | null
  /** 서버에 실제 출결이 기록되어 있는지. 미기록 기본 선택과 구분한다. */
  attendanceRecorded: boolean
  /** schedule attendances / bulk-upsert 키 — roster `participantId` */
  participantId?: number | null
}

export interface SchoolDetailAttendanceSessionGroup {
  id: string
  round: number
  /** 필터 Select value (ISO date 또는 session id) */
  filterValue: string
  /** program_schedule id — 없으면 출석 GET/저장 불가 */
  scheduleId?: number | null
  /** scheduleId가 없어 저장할 수 없는 회차 */
  scheduleIdUnresolved: boolean
  /** 서버가 출석 입력을 받을 수 있는 일정인지(시작 전 등은 false) */
  attendanceRecordingOpen: boolean
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
