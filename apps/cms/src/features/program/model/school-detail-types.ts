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
  /** 일정 변경&취소 이력 횟수 (0이면 배지 미표시) */
  scheduleChangeCancelCount?: number
  region: string
  educationGrade: string
  venue?: string
  mealProvided?: boolean
  mealNotice?: string
  teacherName?: string
  teacherPhone?: string
  teacherEmail?: string
  classCount: number
  studentCount: number
  waitingRoomAvailable?: boolean
  waitingRoomLocation?: string
  lectureRound: string
  textbookName?: string
  textbookStatus: TextbookStatusKey
  textbookQuantity?: number
  instructors: SchoolDetailInstructorRow[]
}

export interface SchoolDetailStudentRow {
  id: string
  no: number
  name: string
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
