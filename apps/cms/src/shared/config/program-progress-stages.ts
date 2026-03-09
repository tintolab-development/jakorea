/**
 * 전체 프로그램 진행 현황 6단계 (필터/위젯용)
 * 참여자 모집 중, 강사 모집 중, 참여자 모집 완료, 강사 모집 완료, 봉사자 모집 완료
 */

import type { ProgramLifecycleStatus } from '@/types/domain'

/** 6단계 키 (educationBeforeTextbook 제외, 교육 진행 중 = educationAfterTextbook으로 쿼리) */
export type ProgramProgressStageKey =
  | 'studentRecruitment'
  | 'instructorRecruitment'
  | 'matchingCompleted'
  | 'educationAfterTextbook'
  | 'educationCompleted'
  | 'documentProcessingCompleted'

/** 6단계 라벨 (위젯 표시용, programLifecycleStatusConfig와 동일 톤) */
export const PROGRAM_PROGRESS_STAGE_LABELS: Record<ProgramProgressStageKey, string> = {
  studentRecruitment: '참여자 모집 중',
  instructorRecruitment: '강사 모집 중',
  matchingCompleted: '참여자 모집 완료',
  educationAfterTextbook: '강사 모집 완료',
  educationCompleted: '강사 모집 완료',
  documentProcessingCompleted: '봉사자 모집 완료',
}

/** 6단계 순서 */
export const PROGRAM_PROGRESS_STAGE_ORDER: ProgramProgressStageKey[] = [
  'studentRecruitment',
  'instructorRecruitment',
  'matchingCompleted',
  'educationAfterTextbook',
  'educationCompleted',
  'documentProcessingCompleted',
]

/** 6단계 ↔ lifecycleStatus (쿼리 파라미터용, 테이블 필터에서 education_after_textbook → before+after 모두 표시) */
export const STAGE_TO_LIFECYCLE: Record<ProgramProgressStageKey, ProgramLifecycleStatus> = {
  studentRecruitment: 'recruiting_students',
  instructorRecruitment: 'recruiting_instructors',
  matchingCompleted: 'matching_completed',
  educationAfterTextbook: 'education_after_textbook',
  educationCompleted: 'education_completed',
  documentProcessingCompleted: 'document_processing_completed',
}

/** 6단계 클릭 시 프로그램 목록 필터: status 쿼리값 */
export const STAGE_TO_PROGRAMS_QUERY: Record<
  ProgramProgressStageKey,
  { type: 'status'; value: ProgramLifecycleStatus }
> = {
  studentRecruitment: { type: 'status', value: 'recruiting_students' },
  instructorRecruitment: { type: 'status', value: 'recruiting_instructors' },
  matchingCompleted: { type: 'status', value: 'matching_completed' },
  educationAfterTextbook: { type: 'status', value: 'education_after_textbook' },
  educationCompleted: { type: 'status', value: 'education_completed' },
  documentProcessingCompleted: { type: 'status', value: 'document_processing_completed' },
}

/** 이 단계 다음에 오른쪽 화살표 표시 */
export const STAGE_HAS_ARROW_AFTER: Set<ProgramProgressStageKey> = new Set([
  'instructorRecruitment',
  'educationAfterTextbook',
  'educationCompleted',
])
