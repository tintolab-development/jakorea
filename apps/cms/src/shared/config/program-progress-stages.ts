/**
 * 전체 프로그램 진행 현황 7단계 (ProgramLifecycleStatus와 1:1 동기화)
 * 대시보드 위젯, 프로그램 목록 필터 등에서 공통 사용
 */

import type { ProgramLifecycleStatus } from '@/types/domain'

/** FR-C01: 7단계 키 (planned 제외) */
export type ProgramProgressStageKey =
  | 'studentRecruitment'
  | 'instructorRecruitment'
  | 'matchingCompleted'
  | 'educationBeforeTextbook'
  | 'educationAfterTextbook'
  | 'educationCompleted'
  | 'documentProcessingCompleted'

/** 7단계 라벨 */
export const PROGRAM_PROGRESS_STAGE_LABELS: Record<ProgramProgressStageKey, string> = {
  studentRecruitment: '수강자 모집',
  instructorRecruitment: '강사 모집',
  matchingCompleted: '매칭 완료',
  educationBeforeTextbook: '교육 진행 중 (교재 발송 전)',
  educationAfterTextbook: '교육 진행 중 (교재 발송 후)',
  educationCompleted: '교육 진행 완료',
  documentProcessingCompleted: '서류 처리 완료',
}

/** 7단계 순서 */
export const PROGRAM_PROGRESS_STAGE_ORDER: ProgramProgressStageKey[] = [
  'studentRecruitment',
  'instructorRecruitment',
  'matchingCompleted',
  'educationBeforeTextbook',
  'educationAfterTextbook',
  'educationCompleted',
  'documentProcessingCompleted',
]

/** 7단계 ↔ lifecycleStatus (프로그램 관리와 동일) */
export const STAGE_TO_LIFECYCLE: Record<ProgramProgressStageKey, ProgramLifecycleStatus> = {
  studentRecruitment: 'recruiting_students',
  instructorRecruitment: 'recruiting_instructors',
  matchingCompleted: 'matching_completed',
  educationBeforeTextbook: 'education_before_textbook',
  educationAfterTextbook: 'education_after_textbook',
  educationCompleted: 'education_completed',
  documentProcessingCompleted: 'document_processing_completed',
}

/** 7단계 클릭 시 프로그램 목록 필터: status=lifecycleStatus */
export const STAGE_TO_PROGRAMS_QUERY: Record<
  ProgramProgressStageKey,
  { type: 'status'; value: ProgramLifecycleStatus }
> = {
  studentRecruitment: { type: 'status', value: 'recruiting_students' },
  instructorRecruitment: { type: 'status', value: 'recruiting_instructors' },
  matchingCompleted: { type: 'status', value: 'matching_completed' },
  educationBeforeTextbook: { type: 'status', value: 'education_before_textbook' },
  educationAfterTextbook: { type: 'status', value: 'education_after_textbook' },
  educationCompleted: { type: 'status', value: 'education_completed' },
  documentProcessingCompleted: { type: 'status', value: 'document_processing_completed' },
}

/** 이 단계 다음에 오른쪽 화살표 표시 (강사모집↔매칭완료, 교재발송후↔교육진행완료) */
export const STAGE_HAS_ARROW_AFTER: Set<ProgramProgressStageKey> = new Set([
  'instructorRecruitment',
  'educationAfterTextbook',
])
