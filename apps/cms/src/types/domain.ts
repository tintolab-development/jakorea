/**
 * 도메인 엔티티 타입 정의
 * project-system-prompt.md 기반
 */

import type { UUID, Status, DateValue } from './index'
import type { ApplicationProgressStatus } from './application-progress'
import type { SettlementCalculationResult } from './settlement-result'

// 후원사 담당자 (이름 + 휴대폰, 담당자 선택 시 휴대폰은 읽기 전용 표시)
export interface SponsorManager {
  name: string
  phone: string
}

// 스폰서
export interface Sponsor {
  id: UUID
  name: string
  nameEn?: string // 후원사명(영문)
  description?: string
  contactInfo?: string
  /** 후원사 담당자 목록 (담당자 선택 시 해당 휴대폰 번호 불러와 읽기 전용 표시) */
  managers?: SponsorManager[]
  securityMemo?: string // 보안/정책 메모
  createdAt: DateValue
  updatedAt: DateValue
}

// 프로그램 유형
export type ProgramType = 'online' | 'offline' | 'hybrid'

// 프로그램 진행 형태
export type ProgramFormat = 'workshop' | 'seminar' | 'course' | 'lecture' | 'other'

// 프로그램 카테고리 (학교 프로그램 vs 개인 프로그램)
export type ProgramCategory = 'school' | 'individual'

// IPS 분류
export type IPSClassification = 'Prepare' | 'Succeed' | 'Inspire'

// 대상 구분
export type TargetLevel = 'elementary' | 'middle' | 'high'

// 기관 구분
export type InstitutionType = 'inside_school' | 'outside_school'

// 신청 경로 타입
export type ApplicationPathType = 'google_form' | 'internal' // 구글폼 / 자동화 프로그램 내 신청

// 신청 경로
export interface ApplicationPath {
  id: UUID
  programId: UUID
  pathType: ApplicationPathType
  googleFormUrl?: string // 구글폼 링크 (pathType이 'google_form'일 때)
  guideMessage?: string // 신청 경로별 안내 문구
  isActive: boolean // 활성화 여부
  createdAt: DateValue
  updatedAt: DateValue
}

// 프로그램 진행 워크플로우 상태 (15개: 예정 4 + 모집 중 4 + 진행 중 3 + 완료 4)
export type ProgramLifecycleStatus =
  | 'planned' // 참여자 모집 예정
  | 'instructor_recruitment_planned' // 강사 모집 예정
  | 'volunteer_recruitment_planned' // 봉사자 모집 예정
  | 'participant_instructor_recruitment_planned' // 참여자&교육자 모집 예정
  | 'recruiting_students' // 참여자 모집 중
  | 'recruiting_instructors' // 강사 모집 중
  | 'recruiting_volunteers' // 봉사자 모집 중
  | 'participant_instructor_recruiting' // 참여자&교육자 모집 중
  | 'education_in_progress' // 프로그램 진행 중
  | 'matching_completed' // 참여자 모집 완료
  | 'education_before_textbook' // 경제교육: 교재 전 단계
  | 'education_after_textbook' // 경제교육: 교재 후 진행 중
  | 'education_completed' // 강사 모집 완료
  | 'document_processing_completed' // 봉사자 모집 완료
  | 'participant_instructor_recruitment_completed' // 참여자&교육자 모집 완료

// 프로그램
export interface Program {
  id: UUID
  sponsorId: UUID
  title: string
  type: ProgramType
  format: ProgramFormat
  category: ProgramCategory // 학교 프로그램 vs 개인 프로그램
  description?: string
  rounds: ProgramRound[] // 회차 정보
  startDate: DateValue
  endDate: DateValue
  applicationStartDate?: DateValue // 신청 시작일
  applicationEndDate?: DateValue // 신청 종료일
  status: Status
  lifecycleStatus?: ProgramLifecycleStatus // 상세 진행 상태 (모집 예정~진행 완료)
  settlementRuleId?: UUID // 정산 규칙 참조
  applicationPathId?: UUID // 신청 경로 참조 (V3 Phase 7)
  // 엑셀 데이터 기반 추가 필드 - 기본 교육실적 정보
  businessArea?: string // 사업분야
  titleEn?: string // 프로그램명(영문)
  mainTitle?: string // 대표 프로그램명(국문)
  textbookName?: string // 교재명(국문)
  textbookNameEn?: string // 교재명(영문)
  schoolId?: UUID // 학교명 (기관) - Application을 통해 연결
  district?: string // 시군구 - School.region에서 추출
  ips?: IPSClassification // IPS 분류 (Prepare/Succeed/Inspire)
  targetLevel?: TargetLevel // 대상 구분 (초/중/고)
  institutionType?: InstitutionType // 기관 구분 (학교 안/밖)
  // 프로그램 설정 정보
  ipOwned?: string // IP Owned (기본값: "JA")
  courseDeliveredBy?: 'JA' | 'Jointly' | 'Partner' // Course Delivered By
  partnerInvolvement?: boolean // Partner Involvement
  programCategory?: string | null // 프로그램 종류 (IPS가 Succeed일 때)
  programChannel?: string | null // 프로그램 채널 및 형식 (IPS가 Inspire일 때)
  educationTime?: number // 교육시간 (시간)
  /** 팀구분 (공통 정보 탭 기본 정보 하단 블록) */
  teamDivision?: string
  /** 교육 과정 (공통 정보 탭 기본 정보 하단 블록, 예: Traditional (Paper)) */
  educationProcess?: string
  // 엑셀 데이터 기반 추가 필드 - 참가자 통계 정보
  maleParticipants?: number // 남성 참가자
  femaleParticipants?: number // 여성 참가자
  totalParticipants?: number // 총 참가자 (계산 가능)
  generalVolunteers?: number // 일반 자원봉사자
  staffVolunteers?: number // 임직원 자원봉사자
  returningVolunteers?: number // 재참여 자원봉사자
  generalTeachers?: number // 일반담당교사
  educatedTeachers?: number // 교육받은교사
  instructors?: number // 강사 수
  managerName?: string // 담당자명
  posterImage?: string // 포스터/키비주얼 이미지 URL
  // 프로그램 등록 추가 필드 (기획 요구사항)
  venue?: string // 진행 장소
  curriculum?: string // 커리큘럼
  contactEmail?: string // 문의처 이메일
  contactPhone?: string // 문의처 연락처
  oneLineIntroduction?: string // 한 줄 소개
  keyVisualImage?: string // 키비주얼 이미지 URL
  /** 추가 내용 (Toast UI Editor getHTML() 출력 HTML) */
  additionalContentHtml?: string
  /** 모집 안내 (텍스트 또는 HTML) */
  recruitmentGuide?: string
  /** 학습 지원 내용 (텍스트 또는 HTML) */
  learningSupportContent?: string
  /** 첨부 파일명 목록 (표시용) */
  attachmentFileNames?: string[]
  /** 결과 발표일 (미설정 시 applicationEndDate 사용) */
  resultAnnouncementDate?: DateValue
  /** 결과 발표 방법 */
  resultAnnouncementMethod?: string
  /** 학생 명단 제출 여부 (참여자 정보 탭) */
  studentListRequired?: 'required' | 'not_required'
  /** 승인된 수강자 수 (표시: approvedStudentCount / capacity 건) */
  approvedStudentCount?: number
  /** 강사 모집 정원 (표시: instructors / instructorCapacity 건) */
  instructorCapacity?: number
  /** 강사 모집 기간 */
  instructorApplicationStartDate?: DateValue
  instructorApplicationEndDate?: DateValue
  /** 1차 서류 합격자 발표 */
  documentPassAnnouncementDate?: DateValue
  documentPassAnnouncementMethod?: string
  /** 2차 면접 심사 */
  interviewStartDate?: DateValue
  interviewEndDate?: DateValue
  interviewMethod?: string
  /** 최종 합격자 발표 */
  finalPassAnnouncementDate?: DateValue
  finalPassAnnouncementMethod?: string
  /** 강사 모집 대상 (강사 정보 탭) */
  instructorTarget?: string
  /** 강사 모집 대상 상세 */
  instructorTargetDetail?: string
  /** 봉사자 모집 기간 */
  volunteerApplicationStartDate?: DateValue
  volunteerApplicationEndDate?: DateValue
  /** 봉사자 모집 대상 (봉사자 정보 탭) */
  volunteerTarget?: string
  /** 봉사자 모집 대상 상세 */
  volunteerTargetDetail?: string
  /** 지원 방법 (강사/봉사자 상세정보 탭) */
  applicationMethod?: string
  /** 기타사항 (강사/봉사자 상세정보 탭) */
  otherNotes?: string
  // 프로그램별 폼 업로드 (기획 요구사항)
  applicationFormTemplateId?: UUID // 신청서 폼 템플릿 ID
  surveyFormTemplateId?: UUID // 설문 폼 템플릿 ID
  satisfactionFormTemplateId?: UUID // 만족도 조사 폼 템플릿 ID
  lectureReportFormTemplateId?: UUID // 강의보고서 폼 템플릿 ID
  createdAt: DateValue
  updatedAt: DateValue
  /** 등록자 표시명 (목록/상세 표시용, API·mock에서 채움) */
  createdByName?: string
  /** 최종 수정자 표시명 (목록/상세 표시용, API·mock에서 채움) */
  updatedByName?: string
}

// 회차별 진행 방식 (교육 커리큘럼 수정용)
export type RoundDeliveryType = 'online' | 'offline' | 'hybrid'

// 프로그램 회차
export interface ProgramRound {
  id: UUID
  programId: UUID
  roundNumber: number
  startDate: DateValue
  endDate: DateValue
  capacity?: number // 정원
  classCount?: number // 학급수
  status: Status
  /** 회차별 강의 분량 및 내용 (예: "1시간 | '개인', '근로자', '소비자' 개념 정의 및 설명") */
  curriculum?: string
  /** 회차별 진행 방식 (온라인/오프라인/온·오프라인) */
  deliveryType?: RoundDeliveryType
}

// 학교
export interface School {
  id: UUID
  name: string
  region: string // 지역
  address?: string
  contactPerson: string // 담당자
  contactPhone?: string
  contactEmail?: string
  createdAt: DateValue
  updatedAt: DateValue
}

// 강사단 종류
export type InstructorType = 'JA' | 'SPECIAL' | 'GEMINAI' | 'OTHER'

// 강사
export interface Instructor {
  id: UUID
  name: string
  contactPhone?: string
  contactEmail?: string
  region: string // 지역
  specialty: string[] // 전문분야
  instructorType?: InstructorType // 강사단 종류 (JA강사단/특강 강사/제미나이 강사단)
  availableTime?: string // 가능시간
  experience?: string // 이력
  rating?: number // 평가 (0-5)
  // 정산 계좌 정보 (민감정보, 마스킹 필요)
  bankName?: string // 은행명
  bankAccount?: string // 계좌번호
  accountHolder?: string // 예금주
  createdAt: DateValue
  updatedAt: DateValue
}

// 신청 주체 타입
export type ApplicationSubjectType = 'school' | 'student' | 'instructor' | 'volunteer'

// 신청 상태
export type ApplicationStatus =
  | 'submitted' // 접수
  | 'reviewing' // 검토
  | 'approved' // 확정
  | 'rejected' // 거절
  | 'cancelled' // 취소
  | 'waiting' // 대기 (정원 초과 시, Phase 3)

// 신청
export interface Application {
  id: UUID
  programId: UUID
  roundId?: UUID // 회차별 신청 시
  applicationPathId?: UUID // 신청 경로 참조 (V3 Phase 7)
  subjectType: ApplicationSubjectType
  subjectId: UUID // 학교/학생/강사 ID
  status: ApplicationStatus
  notes?: string
  /** Phase 0.2.2: 템플릿 기반 동적 신청서 커스텀 필드 (FR-C03) */
  customFields?: Record<string, unknown>
  /** Phase 0.2.2: 학교 신청서 학생 명단 엑셀 파일 URL (FR-C03) */
  studentListFileUrl?: string
  rejectionReason?: string // 거절 사유 (Phase 2)
  waitingListOrder?: number // 대기 목록 순번 (Phase 3)
  /** Phase 0.2.4: 승인 후 진행 단계 (FR-D01 타임라인) */
  progressStatus?: ApplicationProgressStatus
  /** 알림 발송 상태 (발송 완료/미발송) */
  notificationSent?: boolean
  /** 회원 상세 탭: 강의 출석 "출석수/총회차" (예: "0/4") */
  lectureAttendance?: string
  /** 회원 상세 탭: 과제 제출 내역 존재 여부 */
  hasAssignmentSubmission?: boolean
  /** 회원 상세 탭: 담당자명 (예: "이순신 매니저") */
  managerName?: string
  submittedAt: DateValue
  reviewedAt?: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// 일정
export interface Schedule {
  id: UUID
  programId: UUID
  roundId?: UUID
  title: string
  date: DateValue
  startTime: string // HH:mm 형식
  endTime: string // HH:mm 형식
  location?: string // 오프라인 장소
  onlineLink?: string // 온라인 링크
  instructorId?: UUID // 강사 (매칭 후)
  createdAt: DateValue
  updatedAt: DateValue
}

// 매칭
export interface Matching {
  id: UUID
  programId: UUID
  roundId?: UUID
  instructorId: UUID
  scheduleId?: UUID
  status: Status
  matchedAt: DateValue
  cancelledAt?: DateValue
  cancellationReason?: string
  // 감사 로그를 위한 변경 이력 (향후 확장)
  history?: MatchingHistory[]
  createdAt: DateValue
  updatedAt: DateValue
}

// 매칭 이력 (감사 로그)
export interface MatchingHistory {
  id: UUID
  matchingId: UUID
  action: 'created' | 'updated' | 'cancelled'
  previousValue?: string
  newValue?: string
  changedBy?: UUID // 변경한 사용자 (향후 인증 시스템 연동)
  changedAt: DateValue
}

// 정산 항목 타입
export type SettlementItemType = 'instructor_fee' | 'transportation' | 'accommodation' | 'other'

// 정산 항목
export interface SettlementItem {
  type: SettlementItemType
  description: string
  amount: number
}

// 정산 상태
// pending -> calculated -> review -> approved -> paid (중간에 언제든 cancelled 가능)
export type SettlementStatus =
  | 'pending'
  | 'calculated'
  | 'review'
  | 'approved'
  | 'paid'
  | 'cancelled'

// 정산 첨부 파일 (Mock용 메타데이터)
export interface SettlementAttachment {
  id: string
  fileName: string
  fileSize?: number
}

// 정산
export interface Settlement {
  id: UUID
  programId: UUID
  instructorId: UUID
  matchingId: UUID
  period: string // 월별 또는 프로그램별 (예: "2025-01" 또는 "program-{id}")
  items: SettlementItem[]
  totalAmount: number
  status: SettlementStatus
  documentGeneratedAt?: DateValue
  notes?: string
  attachments?: SettlementAttachment[] // 증빙 파일 메타데이터 (Mock)
  /** FR-G01: 통행료 증빙 검토 (관리자 검토 프로세스) */
  tollReceiptReview?: {
    status: 'pending' | 'approved' | 'rejected'
    reviewedAt?: DateValue
    reviewedBy?: UUID
    comment?: string
  }
  /** Phase 0.2.5: 강사 산출내역 확인 (FR-E01) */
  calculationResult?: SettlementCalculationResult
  approvalHistories?: Array<{
    id: string
    step: 'pending' | 'review' | 'approval' | 'payment'
    action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'paid' | 'cancelled'
    actionLabel: string
    reviewerName?: string
    comment?: string
    createdAt: DateValue
  }> // 승인 이력 (V3 Phase 4)
  createdAt: DateValue
  updatedAt: DateValue
}

// 지급조서 상태
export type PaymentStatementStatus = 'ready' | 'downloaded' | 'cancelled'

// 지급조서
export interface PaymentStatement {
  id: UUID
  settlementId: UUID
  programId: UUID
  instructorId: UUID
  period: string
  totalAmount: number
  status: PaymentStatementStatus
  generatedAt: DateValue
  lastDownloadedAt?: DateValue
  /** 강사 확인 완료 여부 */
  instructorConfirmed?: boolean
  /** 강사 확인 완료 일시 */
  instructorConfirmedAt?: DateValue
  /** 계좌 지급 완료 여부 */
  paymentCompleted?: boolean
  /** 계좌 지급 완료 일시 */
  paymentCompletedAt?: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// 실적 통계
export interface PerformanceStats {
  id: UUID
  programId: UUID
  programName: string
  sponsorId?: UUID
  period: {
    startDate: DateValue
    endDate: DateValue
  }
  stats: {
    totalApplications: number
    approvedApplications: number
    totalSchools: number
    totalStudents: number
    totalInstructors: number
    totalSessions: number
    totalSettlementAmount: number
    satisfactionScore: number
  }
  businessArea?: string
  ips?: string
  targetLevel?: string
  institutionType?: string
  region?: string
  createdAt: DateValue
  updatedAt: DateValue
}

// To-do 타입
export type TodoType = 'REPORT' | 'COMPLETE' | 'REVIEW' | 'SUBMIT' | 'OTHER'

// To-do
export interface Todo {
  id: UUID
  userId?: UUID // 사용자 ID (향후 인증 시스템 연동)
  type: TodoType
  label: string // To-do 제목
  description?: string // 작업 설명
  expectedResult?: string // 완료 후 결과 안내
  targetUrl: string // 실행할 URL
  priority: number // 우선순위 (낮을수록 높음)
  completed: boolean
  completedAt?: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// 보고서 타입
export type ReportType = 'lecture' | 'volunteer' | 'program'

// 보고서 상태
export type ReportStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected'

// 보고서 필드 타입
export type ReportFieldType = 'text' | 'textarea' | 'number' | 'date' | 'select'

// 보고서 필드
export interface ReportField {
  id: string
  label: string
  type: ReportFieldType
  required: boolean
  placeholder?: string
  options?: Array<{ value: string; label: string }> // select 타입일 경우
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

// 보고서
export interface Report {
  id: UUID
  type: ReportType
  activityId?: UUID // 강의/봉사 활동 ID
  programId?: UUID // 프로그램 ID (프로그램 보고서일 경우)
  /** Phase 0.2.7: 강의보고서 일정 ID (activity 없이 제출 시) */
  scheduleId?: UUID
  fields: Record<string, string | number | DateValue> // 필드 ID를 키로 하는 값
  status: ReportStatus // 보고서 상태 (Phase 7.1.1)
  submittedAt: DateValue
  reviewedAt?: DateValue // 검토일 (Phase 7.1.1)
  reviewedBy?: UUID // 검토자 ID (Phase 7.1.1)
  reviewNotes?: string // 검토 사유 (Phase 7.1.1)
  createdAt: DateValue
  updatedAt: DateValue
}

// 강의 상태
export type LectureStatus = 'LECT_01' | 'LECT_02' | 'LECT_03' // 예정, 진행, 완료

// 봉사 상태
export type VolunteerStatus = 'VOL_01' | 'VOL_02' | 'VOL_03' // 예정, 진행, 완료

// 다음 필수 행동 타입
export type NextRequiredActionType = 'NONE' | 'COMPLETE' | 'REPORT'

// 다음 필수 행동
export interface NextRequiredAction {
  type: NextRequiredActionType
  targetUrl?: string
}

// 강의 활동
export interface LectureActivity {
  id: UUID
  scheduleId: UUID
  programId: UUID
  instructorId: UUID
  status: LectureStatus
  roleDescription: string // 역할 및 수행 안내
  nextRequiredAction: NextRequiredAction
  createdAt: DateValue
  updatedAt: DateValue
}

// 봉사 활동
export interface VolunteerActivity {
  id: UUID
  scheduleId: UUID
  programId: UUID
  volunteerId: UUID
  status: VolunteerStatus
  roleDescription: string // 봉사 역할 및 수행 안내
  volunteerHoursInfo?: {
    hours: number // 인정 봉사시간
  }
  nextRequiredAction: NextRequiredAction
  createdAt: DateValue
  updatedAt: DateValue
}

// 사용자 주요 상태
export type PrimaryStatus =
  | 'APPLY_01' // 승인 대기
  | 'APPLY_02' // 반려
  | 'APPLY_03' // 승인 완료
  | 'SCH_01' // 일정 예정
  | 'SCH_02' // 일정 진행
  | 'SCH_03' // 일정 종료
  | 'LECT_03' // 강의 완료
  | 'VOL_03' // 봉사 완료
  | 'NONE' // 상태 없음

// 이력 최종 상태
export type FinalStatus = 'COMPLETED' | 'CONFIRMED' | 'CANCELLED'

// 참여 역할
export type ParticipationRole = 'INSTRUCTOR' | 'VOLUNTEER' | 'PARTICIPANT'

// 정산 상태
export type PaymentStatus = 'PAY_01' | 'PAY_02' | 'PAY_03' | 'PAY_04' // 대기, 산출, 승인, 지급 완료

// 증빙 문서
export interface Certificate {
  id: UUID
  title: string
  downloadUrl: string
  issuedAt: DateValue
}

// 사용자 이력
export interface UserHistory {
  id: UUID
  userId: UUID // 사용자 ID (참여이력 동기화용)
  programId: UUID
  role: ParticipationRole
  completedAt: DateValue
  finalStatus: FinalStatus
  // 강사인 경우
  paymentStatus?: PaymentStatus
  paymentAmount?: number
  // 봉사자인 경우
  volunteerHours?: number
  // 공통
  certificates?: Certificate[]
  createdAt: DateValue
  updatedAt: DateValue
}

// 마이페이지 데이터
export interface MyPageData {
  primaryStatus: PrimaryStatus
  reasonPublic?: string // 반려 사유 등
  todos: Todo[] // 최대 2개
  upcomingSchedules?: Schedule[] // 승인 완료된 일정
  historySummary?: UserHistory[] // 최대 3개
}

// 프로그램 통계 (참가자 통계) - DEPRECATED: Program 엔티티로 통합됨
// @deprecated ProgramStatistics는 Program 엔티티에 통합되었습니다. Program 필드를 사용하세요.
export interface ProgramStatistics {
  id: UUID
  programId: UUID
  roundId?: UUID
  scheduleId?: UUID
  // 참가자 통계
  maleParticipants: number // 남성 참가자
  femaleParticipants: number // 여성 참가자
  totalParticipants: number // 총 참가자 (계산 가능)
  // 자원봉사자 통계
  generalVolunteers: number // 일반 자원봉사자
  staffVolunteers: number // 임직원 자원봉사자
  returningVolunteers: number // 재참여 자원봉사자
  // 교사/강사 통계
  generalTeachers: number // 일반담당교사
  educatedTeachers: number // 교육받은교사
  instructors: number // 강사 수
  // 담당자
  managerName?: string // 담당자명
  createdAt: DateValue
  updatedAt: DateValue
}

// 프로그램 게시글 (수강 프로그램 상세 모달 — 게시글 탭)
export interface ProgramPost {
  id: UUID
  programId: UUID
  /** 참여기관(학교) 단위 게시글일 때 해당 학교 ID (미설정 시 프로그램 전체 공지) */
  schoolId?: UUID
  /** 작성자 표시명 (예: "박○○ 담당교사님", "JA KOREA 알림") */
  authorName: string
  /** 작성자 사용자 ID (선택, 프로필 연동용) */
  authorUserId?: UUID
  title?: string
  content: string
  /** 읽음 여부 (수강자/회원 관점) — 미읽음이면 민트 스트로크 + "읽지 않음" 태그 */
  read: boolean
  viewCount: number
  /** 반응/이모티콘 수 */
  reactionCount: number
  commentCount: number
  /** 첨부 파일 개수 */
  attachmentCount: number
  /** 게시글 상태 태그 (예: [공지사항], [일정 알림]) */
  postType?: 'notice' | 'schedule'
  publishedAt: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// 프로그램 첨부 파일 (수강 프로그램 상세 모달 — 파일 및 사진 탭)
export interface ProgramFile {
  id: UUID
  programId: UUID
  /** 업로드된 게시글 ID (원글 보기 링크용) */
  postId?: UUID
  fileName: string
  /** 파일 확장자 또는 MIME 타입 (아이콘/표시용) */
  fileType?: string
  fileSize?: number
  /** 다운로드/미리보기 URL (mock에서는 placeholder 가능) */
  fileUrl?: string
  uploadedAt: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}

// 일정 협의 (Phase 8)
export type NegotiationStatus = 'proposed' | 'accepted' | 'rejected' | 'revised'

export interface ScheduleNegotiationProposal {
  id: UUID
  date: DateValue
  startTime?: string // HH:mm
  endTime?: string // HH:mm
  status: 'pending' | 'accepted' | 'rejected'
  note?: string
}

export interface ScheduleNegotiation {
  id: UUID
  programId: UUID
  schoolId: UUID
  proposals: ScheduleNegotiationProposal[]
  status: NegotiationStatus
  createdAt: DateValue
  updatedAt: DateValue
}
