import type { RecruitmentStatus } from '@jakorea/domain/recruitment/recruitment-status'
import type { EducationForm } from '@/features/program'

export type EducationApplicationTab = 'all' | 'applied' | 'in_progress' | 'completed'

/** 교육현황 목록 — 진행 상태 (정렬·탭·톤 SSOT 키) */
export type EducationDisplayStatus =
  | 'waiting_result'
  | 'document_passed'
  | 'in_progress'
  | 'completed'
  | 'withdrawn'
  | 'rejected'

export type EducationDisplayStatusTone = 'pending' | 'progress' | 'completed' | 'rejected'

export type EducationApplicationListItem = {
  id: string
  programId: string
  categoryLabel: string
  title: string
  recruitmentPeriodLabel: string
  operatingPeriodLabel: string
  recruitmentStatus: RecruitmentStatus
  educationTargetLabel: string
  educationForm: EducationForm
  educationFormLabel: string
  thumbnailUrl?: string
  displayStatus: EducationDisplayStatus
  /** 면접 전형 포함 여부 — 서류 합격 배너 노출 조건 */
  hasInterview?: boolean
  /** 관리자 배정 면접일 표시 문구 (예: 2026년 04월 12일(일) 14시) */
  interviewAtLabel?: string
  /** 신청 내용 — 자기소개 및 지원동기 */
  selfIntroMotivation?: string
  /** 신청 내용 — 진행 희망 교육 일정 표시 문구 */
  preferredEducationScheduleLabel?: string
}

export type EducationApplicationListParams = {
  tab: EducationApplicationTab
  page: number
}

export const EDUCATION_APPLICATION_PAGE_SIZE = 10
