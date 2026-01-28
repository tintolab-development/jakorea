/**
 * 도메인별 상태 라벨/색상 설정
 * 보고서 타입, 매칭 액션 등 도메인 특화 상태 중앙 관리
 */

import type { Report } from '@/types/domain'

// 보고서 타입 설정
export const REPORT_TYPE_CONFIG = {
  labels: {
    lecture: '강의보고서',
    volunteer: '교육봉사 활동보고서',
    program: '프로그램 종료 보고서',
  } as Record<Report['type'], string>,

  colors: {
    lecture: 'blue',
    volunteer: 'purple',
    program: 'cyan',
  } as Record<Report['type'], string>,
} as const

export function getReportTypeLabel(type: Report['type']): string {
  return REPORT_TYPE_CONFIG.labels[type] || type
}

export function getReportTypeColor(type: Report['type']): string {
  return REPORT_TYPE_CONFIG.colors[type] || 'default'
}

// 매칭 액션 라벨
export const MATCHING_ACTION_LABELS = {
  created: '생성',
  updated: '수정',
  cancelled: '취소',
} as const

export function getMatchingActionLabel(action: string): string {
  return MATCHING_ACTION_LABELS[action as keyof typeof MATCHING_ACTION_LABELS] || action
}
