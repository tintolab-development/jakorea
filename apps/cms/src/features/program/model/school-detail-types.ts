/**
 * 학교 상세 정보 모달용 타입
 * 명세: docs/design/school-detail-modal-spec.md
 */

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

/** 과제 제출 내역 모달: 회차별 제출 상태 */
export type AssignmentSubmissionStatusKey = 'submitted' | 'not_submitted' | 'not_started'

export interface AssignmentSubmissionSession {
  roundNumber: number
  status: AssignmentSubmissionStatusKey
}

export interface AssignmentSubmissionDetail {
  studentName: string
  submissionRatePercent: number
  sessions: AssignmentSubmissionSession[]
}

export const ASSIGNMENT_SUBMISSION_STATUS_LABELS: Record<
  AssignmentSubmissionStatusKey,
  string
> = {
  submitted: '제출완료',
  not_submitted: '미제출',
  not_started: '강의 미진행',
}
