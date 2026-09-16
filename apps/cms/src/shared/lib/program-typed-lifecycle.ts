/**
 * Admin typed ProgramResponse.lifecycleStatus — 목록·상세 상단 위젯 SSOT.
 * serviceDetailJson / periodStatus 로 위젯·테이블을 채우지 않는다.
 *
 * 진행현황 UI는 제품 규칙 3상태만 노출한다.
 * recruiting_students 는 「모집 중」이 아니라 「프로그램 진행 예정」버킷.
 */

import type { ProgramLifecycleStatus } from '@/types/domain'

/** BE typed 어휘 (일반 Primary · 1사1교 ONE) — API 필드는 4종 유지 */
export const TYPED_PROGRAM_LIFECYCLE_STATUSES = [
  'scheduled',
  'recruiting_students',
  'in_progress',
  'completed',
] as const

export type TypedProgramLifecycleStatus = (typeof TYPED_PROGRAM_LIFECYCLE_STATUSES)[number]

/** 목록「진행 현황」·상세「프로그램 진행상태」공통 UI 버킷 (3상태) */
export type ProgramProgressUiBucket = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'

const PROGRAM_PROGRESS_UI_BUCKET_LABELS: Record<ProgramProgressUiBucket, string> = {
  SCHEDULED: '프로그램 진행 예정',
  IN_PROGRESS: '프로그램 진행 중',
  COMPLETED: '프로그램 진행 완료',
}

const PROGRAM_PROGRESS_UI_BUCKET_COLORS: Record<ProgramProgressUiBucket, string> = {
  SCHEDULED: 'var(--color-green, #1E8C29)',
  IN_PROGRESS: 'var(--color-blue, #017EAF)',
  COMPLETED: 'var(--default-BK, #3D3D3D)',
}

/**
 * typed API 값 → 표시 라벨.
 * recruiting_students 는 진행 예정과 동일 문구 (모집 중 단독 노출 금지).
 */
export const TYPED_PROGRAM_LIFECYCLE_LABELS: Record<TypedProgramLifecycleStatus, string> = {
  scheduled: PROGRAM_PROGRESS_UI_BUCKET_LABELS.SCHEDULED,
  recruiting_students: PROGRAM_PROGRESS_UI_BUCKET_LABELS.SCHEDULED,
  in_progress: PROGRAM_PROGRESS_UI_BUCKET_LABELS.IN_PROGRESS,
  completed: PROGRAM_PROGRESS_UI_BUCKET_LABELS.COMPLETED,
}

export const TYPED_PROGRAM_LIFECYCLE_COLORS: Record<TypedProgramLifecycleStatus, string> = {
  scheduled: PROGRAM_PROGRESS_UI_BUCKET_COLORS.SCHEDULED,
  recruiting_students: PROGRAM_PROGRESS_UI_BUCKET_COLORS.SCHEDULED,
  in_progress: PROGRAM_PROGRESS_UI_BUCKET_COLORS.IN_PROGRESS,
  completed: PROGRAM_PROGRESS_UI_BUCKET_COLORS.COMPLETED,
}

const TYPED_SET = new Set<string>(TYPED_PROGRAM_LIFECYCLE_STATUSES)

/**
 * API·레거시 FE 값을 typed 4종으로 정규화.
 * periodStatus 대문자 / education_in_progress 등은 표시용 리다이렉트만 (typed 필드 우선).
 */
export function normalizeTypedProgramLifecycleStatus(
  raw?: string | null
): TypedProgramLifecycleStatus | undefined {
  if (raw == null || String(raw).trim() === '') return undefined
  const value = String(raw).trim()
  const lower = value.toLowerCase()

  if (TYPED_SET.has(lower)) return lower as TypedProgramLifecycleStatus

  switch (value.toUpperCase().replace(/-/g, '_')) {
    case 'SCHEDULED':
    case 'PLANNED':
      return 'scheduled'
    case 'RECRUITING':
    case 'RECRUITING_STUDENTS':
    case 'RECRUITING_INSTRUCTORS':
    case 'RECRUITING_VOLUNTEERS':
    case 'PARTICIPANT_INSTRUCTOR_RECRUITING':
      return 'recruiting_students'
    case 'IN_PROGRESS':
    case 'RUNNING':
    case 'EDUCATION_IN_PROGRESS':
    case 'EDUCATION_BEFORE_TEXTBOOK':
    case 'EDUCATION_AFTER_TEXTBOOK':
      return 'in_progress'
    case 'COMPLETED':
    case 'ENDED':
    case 'EDUCATION_COMPLETED':
    case 'DOCUMENT_PROCESSING_COMPLETED':
    case 'MATCHING_COMPLETED':
    case 'PARTICIPANT_INSTRUCTOR_RECRUITMENT_COMPLETED':
      return 'completed'
    default:
      break
  }

  // FE legacy snake_case already lower
  switch (lower) {
    case 'planned':
    case 'instructor_recruitment_planned':
    case 'volunteer_recruitment_planned':
    case 'participant_instructor_recruitment_planned':
      return 'scheduled'
    case 'recruiting_instructors':
    case 'recruiting_volunteers':
    case 'participant_instructor_recruiting':
      return 'recruiting_students'
    case 'education_in_progress':
    case 'education_before_textbook':
    case 'education_after_textbook':
      return 'in_progress'
    case 'education_completed':
    case 'document_processing_completed':
    case 'matching_completed':
    case 'participant_instructor_recruitment_completed':
      return 'completed'
    default:
      return undefined
  }
}

/** Program.lifecycleStatus에 넣을 typed 값 (레거시 → typed) */
export function toTypedProgramLifecycleStatus(
  raw?: string | null
): ProgramLifecycleStatus | undefined {
  return normalizeTypedProgramLifecycleStatus(raw) as ProgramLifecycleStatus | undefined
}

/**
 * lifecycleStatus → UI 3버킷.
 * scheduled + recruiting_students (+ null/미지) → SCHEDULED
 */
export function getProgramProgressUiBucket(
  status: ProgramLifecycleStatus | string | null | undefined
): ProgramProgressUiBucket {
  const typed = normalizeTypedProgramLifecycleStatus(status)
  if (typed === 'in_progress') return 'IN_PROGRESS'
  if (typed === 'completed') return 'COMPLETED'
  return 'SCHEDULED'
}

/** 목록·상세 진행현황 공통 라벨 (3상태만) */
export function getProgramProgressUiLabel(
  status: ProgramLifecycleStatus | string | null | undefined
): string {
  return PROGRAM_PROGRESS_UI_BUCKET_LABELS[getProgramProgressUiBucket(status)]
}

export function getTypedProgramLifecycleLabel(
  status: ProgramLifecycleStatus | string | null | undefined
): string {
  return getProgramProgressUiLabel(status)
}

export function getTypedProgramLifecycleDisplay(
  status: ProgramLifecycleStatus | string | null | undefined
): { status: TypedProgramLifecycleStatus | null; label: string; color: string } {
  const typed = normalizeTypedProgramLifecycleStatus(status) ?? null
  const bucket = getProgramProgressUiBucket(status)
  return {
    status: typed,
    label: PROGRAM_PROGRESS_UI_BUCKET_LABELS[bucket],
    color: PROGRAM_PROGRESS_UI_BUCKET_COLORS[bucket],
  }
}

export function isTypedProgramLifecycleStatus(
  value: string | null | undefined
): value is TypedProgramLifecycleStatus {
  return (
    normalizeTypedProgramLifecycleStatus(value) != null &&
    TYPED_SET.has(String(value).trim().toLowerCase())
  )
}
