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

/**
 * 활동 포기 시점.
 * - `before_education`: 승인 후·교육 시작 전 포기 → 서류 합격과 동일 탭, 상태만 활동 포기·합격 배너 비노출
 * - `during_education`: 교육 진행 중 포기 → 진행중과 유사 탭(안내사항 제외), 포기 이전 회차만 노출
 */
export type EducationWithdrawalPhase = 'before_education' | 'during_education'

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
  /** `displayStatus === 'withdrawn'` 일 때 포기 시점 */
  withdrawalPhase?: EducationWithdrawalPhase
  /**
   * 진행 중 포기 시 마지막으로 참여한 회차(1-based).
   * 예: 10회차 중 3회차까지 진행 후 포기 → `3` — 이후 회차 일정·과제·자료 비노출
   */
  lastParticipatedSession?: number
}

export type EducationApplicationListParams = {
  tab: EducationApplicationTab
  page: number
}

export const EDUCATION_APPLICATION_PAGE_SIZE = 10
