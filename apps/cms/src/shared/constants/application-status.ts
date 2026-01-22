/**
 * 신청 상태값 정의
 * Phase 0.1.4: 상태값/기본 모델 정의 (요구사항 §3.3)
 * 
 * §3.3 상태값(진행상황) — 최소 요구
 * 8단계 상태값 정의
 */

import type { ApplicationProgressStatus } from '@/types/application-progress'

/**
 * §3.3 상태값(진행상황) — 최소 요구
 * 8단계 상태값 정의
 */
export const APPLICATION_STATUS = {
  RECEIVED: { label: '신청(접수)', order: 1, color: 'default' },
  MATCHING_IN_PROGRESS: { label: '매칭 진행중', order: 2, color: 'processing' },
  MATCHING_COMPLETED: { label: '매칭 완료', order: 3, color: 'success' },
  MATERIAL_PREPARING: { label: '교재 배송 준비중', order: 4, color: 'processing' },
  MATERIAL_SHIPPED: { label: '교재 발송 완료', order: 5, color: 'success' },
  IN_PROGRESS: { label: '교육 실시', order: 6, color: 'processing' },
  SURVEY_SUBMITTED: { label: '만족도 조사 제출', order: 7, color: 'success' },
  REPORT_SUBMITTED: { label: '강의보고서 제출', order: 8, color: 'success' },
} as const

/**
 * §3.1 학교 신청 프로세스 상세 상태
 */
export const SCHOOL_APPLICATION_STATUS = {
  APPLIED: { label: '신청완료', order: 1 },
  MATCHING: { label: '매칭진행', order: 2 },
  MATCHED: { label: '매칭완료', order: 3 },
  MATERIAL_PREPARING: { label: '교재배송준비', order: 4 },
  MATERIAL_SHIPPED: { label: '교재발송완료', order: 5 },
  EDUCATION_IN_PROGRESS: { label: '교육실시', order: 6 },
  SURVEY_SUBMITTED: { label: '만족도제출', order: 7 },
  REPORT_SUBMITTED: { label: '강의보고서제출', order: 8 },
} as const

/**
 * ApplicationProgressStatus를 APPLICATION_STATUS 형식으로 변환
 */
export function getApplicationStatusConfig(status: ApplicationProgressStatus) {
  return APPLICATION_STATUS[status] || { label: status, order: 0, color: 'default' }
}

/**
 * 상태 라벨 가져오기
 */
export function getApplicationStatusLabel(status: ApplicationProgressStatus): string {
  return APPLICATION_STATUS[status]?.label || status
}

/**
 * 상태 색상 가져오기
 */
export function getApplicationStatusColor(status: ApplicationProgressStatus): string {
  return APPLICATION_STATUS[status]?.color || 'default'
}

/**
 * 상태 순서 가져오기
 */
export function getApplicationStatusOrder(status: ApplicationProgressStatus): number {
  return APPLICATION_STATUS[status]?.order || 0
}

/**
 * 학교 신청 상태 라벨 가져오기
 */
export function getSchoolApplicationStatusLabel(
  status: keyof typeof SCHOOL_APPLICATION_STATUS
): string {
  return SCHOOL_APPLICATION_STATUS[status]?.label || status
}

/**
 * 학교 신청 상태 순서 가져오기
 */
export function getSchoolApplicationStatusOrder(
  status: keyof typeof SCHOOL_APPLICATION_STATUS
): number {
  return SCHOOL_APPLICATION_STATUS[status]?.order || 0
}
