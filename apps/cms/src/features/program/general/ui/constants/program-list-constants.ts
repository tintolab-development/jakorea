/**
 * 프로그램 목록 테이블/필터용 상수 및 헬퍼
 * 컬럼 정의와 필터 옵션에서 공통 사용
 * getRecruitmentStatus는 program-detail-info-constants 단일 소스에서 re-export
 */

import type { Program, ProgramCategory, ProgramLifecycleStatus, TargetLevel } from '@/types/domain'
import { programLifecycleStatusConfig, getProgramLifecycleLabel } from '@/shared/constants/status'
import { getRecruitmentStatus } from '../../../shared/lib/program-detail-info-constants'

export { getRecruitmentStatus }

export const programTypes = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '하이브리드' },
]

export const programFormats = [
  { value: 'workshop', label: '워크샵' },
  { value: 'seminar', label: '세미나' },
  { value: 'course', label: '과정' },
  { value: 'lecture', label: '강의' },
  { value: 'other', label: '기타' },
]

export const statusOptions = programLifecycleStatusConfig.order.map(status => ({
  value: status,
  label: getProgramLifecycleLabel(status),
}))

/** 프로그램 목록 —「프로그램 진행 현황」필터 (3단계, 위젯 구간과 동일) */
export type ProgramProgressPhaseFilter = 'scheduled' | 'in_progress' | 'completed'

export const programProgressPhaseFilterOptions: {
  value: ProgramProgressPhaseFilter
  label: string
}[] = [
  { value: 'scheduled', label: '프로그램 진행 예정' },
  { value: 'in_progress', label: '프로그램 진행 중' },
  { value: 'completed', label: '프로그램 진행 완료' },
]

const programProgressPhaseLifecycleMap: Record<
  ProgramProgressPhaseFilter,
  readonly ProgramLifecycleStatus[]
> = {
  scheduled: [
    'recruiting_students',
    'recruiting_instructors',
    'matching_completed',
    'education_before_textbook',
  ],
  in_progress: ['education_after_textbook', 'education_in_progress'],
  completed: ['education_completed', 'document_processing_completed'],
}

export const programProgressPhaseFilterValues = new Set<ProgramProgressPhaseFilter>(
  programProgressPhaseFilterOptions.map(o => o.value)
)

export function isProgramProgressPhaseFilter(value: string): value is ProgramProgressPhaseFilter {
  return programProgressPhaseFilterValues.has(value as ProgramProgressPhaseFilter)
}

export function programMatchesProgressPhase(
  program: Pick<Program, 'lifecycleStatus'>,
  phase: ProgramProgressPhaseFilter
): boolean {
  const status = program.lifecycleStatus
  if (!status) return false
  return programProgressPhaseLifecycleMap[phase].includes(status)
}

export const recruitmentStatusOptions = [
  { value: 'scheduled', label: '모집 예정' },
  { value: 'recruiting', label: '모집 중' },
  { value: 'closed', label: '모집 마감' },
]

export const businessAreaOptions = [
  { value: '경제금융', label: '경제금융' },
  { value: '기업가정신', label: '기업가정신' },
  { value: '진로취업', label: '진로취업' },
  { value: '디지털리터러시', label: '디지털리터러시' },
]

export const targetLevelOptions: { value: TargetLevel; label: string }[] = [
  { value: 'elementary', label: '초등' },
  { value: 'middle', label: '중등' },
  { value: 'high', label: '고등' },
]

export const categoryOptions: { value: ProgramCategory; label: string }[] = [
  { value: 'school', label: '학교(단체)' },
  { value: 'individual', label: '개인 학생' },
]

/** 프로그램 목록 필터·테이블: 참여자 유형 */
export const programParticipantTypeOptions = [
  { value: 'school', label: '학교/기관' },
  { value: 'individual', label: '개인' },
  { value: 'instructor', label: '교사/강사' },
  { value: 'volunteer', label: '봉사자' },
]

/** 프로그램 목록 필터: 교육 대상 */
export const programListTargetLevelOptions = [
  { value: 'elementary', label: '초등학생' },
  { value: 'middle', label: '중학생' },
  { value: 'high', label: '고등학생' },
  { value: 'college', label: '대학생' },
  { value: 'adult', label: '성인' },
]

/** 프로그램 목록 참여자 유형 표기 (필터 옵션과 동일) */
export function getProgramParticipantTypeLabel(value: string | undefined): string {
  if (value == null || value === '') return '-'
  const hit = programParticipantTypeOptions.find(o => o.value === value)
  return hit?.label ?? value
}

/** 프로그램 목록 교육 대상 표기 (필터 옵션과 동일, `초등` 등 단축 라벨과 구분) */
export function getProgramListTargetLevelLabel(value: string | undefined): string {
  if (value == null || value === '') return '-'
  const hit = programListTargetLevelOptions.find(o => o.value === value)
  if (hit) return hit.label
  const legacyShort: Record<string, string> = {
    초: '초등학생',
    중: '중학생',
    고: '고등학생',
  }
  return legacyShort[value] ?? value
}
