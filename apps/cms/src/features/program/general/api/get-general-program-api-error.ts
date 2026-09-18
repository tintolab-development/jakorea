/**
 * 일반 프로그램 API 에러 메시지 추출 · CONFLICT 한글화
 */

import { CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE } from '@/entities/program/lib/program-pm-role-policy'

const BUSINESS_START_LOCK_PATTERN =
  /business_start_date|schedule lock|only be modified before/i

const SPONSOR_INVALID_PATTERN = /sponsor|후원사|program_sponsor|sponsorId/i

/** Portal 희망 교육 일정 서버 검증 — BE 회신 2026-09-18 */
const PREFERRED_SCHEDULE_ERROR_MESSAGES: Record<string, string> = {
  PREFERRED_SCHEDULE_OUTSIDE_EDUCATION_RANGE:
    '희망 교육 일정이 프로그램 교육 가능 기간을 벗어났습니다.',
  PREFERRED_SCHEDULE_EXCEEDS_MAX_SCHEDULE_COUNT:
    '희망 교육 일정 지망 수가 모집 상한을 초과했습니다.',
  PREFERRED_SCHEDULE_EXCEEDS_MAX_SESSIONS_PER_DAY:
    '하루 희망 차시 수가 모집 상한을 초과했습니다.',
}

export function getGeneralProgramApiErrorMessage(error: unknown, fallback: string): string {
  const code = extractApiErrorCode(error)
  if (code === 'INVALID_PROGRAM_ASSIGNMENT_ROLE') {
    return CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE
  }
  if (code && PREFERRED_SCHEDULE_ERROR_MESSAGES[code]) {
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    // 서버가 동일/구체 메시지를 주면 우선, code만 오면 FE 매핑
    if (raw && raw !== code) return raw
    return PREFERRED_SCHEDULE_ERROR_MESSAGES[code]
  }
  const raw = extractRawApiMessage(error)
  if (raw && BUSINESS_START_LOCK_PATTERN.test(raw)) {
    return '사업 시작일이 지난 프로그램은 수정할 수 없습니다. 시작일 이전에만 정보 수정이 가능합니다.'
  }
  if (raw && SPONSOR_INVALID_PATTERN.test(raw)) {
    return '유효한 후원사를 선택해 주세요. 존재하지 않거나 사용할 수 없는 후원사입니다.'
  }
  if (raw?.trim()) {
    // CONFLICT: prefix 제거
    return raw.replace(/^CONFLICT:\s*/i, '').trim() || fallback
  }
  return fallback
}

function extractApiErrorPayload(error: unknown): Record<string, unknown> | undefined {
  if (!error || typeof error !== 'object' || !('response' in error)) return undefined
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (!data || typeof data !== 'object') return undefined
  return data as Record<string, unknown>
}

function extractApiErrorCode(error: unknown): string | undefined {
  const data = extractApiErrorPayload(error)
  if (!data) return undefined
  if (typeof data.error === 'object' && data.error && 'code' in data.error) {
    const nested = (data.error as { code?: unknown }).code
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
  }
  if (typeof data.code === 'string' && data.code.trim()) return data.code.trim()
  return undefined
}

function extractRawApiMessage(error: unknown): string | undefined {
  const data = extractApiErrorPayload(error)
  if (data) {
    if (typeof data.message === 'string') return data.message
    if (typeof data.error === 'object' && data.error && 'message' in data.error) {
      const nested = (data.error as { message?: unknown }).message
      if (typeof nested === 'string') return nested
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return undefined
}
