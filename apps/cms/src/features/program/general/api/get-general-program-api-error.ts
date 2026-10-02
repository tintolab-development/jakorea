/**
 * 일반 프로그램 API 에러 메시지 추출 · CONFLICT 한글화
 */

import { CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE } from '@/entities/program/lib/program-pm-role-policy'
import {
  isProgramRecruitmentEditPeriodCode,
  programEditWindowErrorMessage,
} from '@/shared/lib/program-edit-window-error-message'

const BUSINESS_START_LOCK_PATTERN =
  /business_start_date|schedule lock|only be modified before/i

const SPONSOR_INVALID_PATTERN = /sponsor|후원사|program_sponsor|sponsorId/i

/** Portal 희망 교육 일정 서버 검증 — BE 회신 2026-09-18 */
const PROGRESS_INSTRUCTOR_ERROR_MESSAGES: Record<string, string> = {
  PARTICIPANT_TYPE_UNSUPPORTED: '이 경로로는 강사 참여자만 등록할 수 있습니다.',
  INSTRUCTOR_MEMBER_REQUIRED: '강사 역할이 있는 회원만 등록할 수 있습니다.',
  PROGRAM_PARTICIPANT_ALREADY_EXISTS: '이미 이 프로그램에 참여 중입니다.',
  PARTICIPANT_MEMBER_TYPE_INVALID: '이 회원은 해당 유형으로 등록할 수 없습니다.',
  TEXTBOOK_DELIVERY_NOT_APPLICABLE: '이 기관에는 교재가 없어 배송 상태를 변경할 수 없습니다.',
  VOLUNTEER_ASSIGNMENT_REVISION_CONFLICT: '봉사 배정이 변경되어 다시 시도해 주세요.',
  VOLUNTEER_ASSIGNMENT_STARTED_USE_GIVE_UP:
    '이미 시작된 봉사 일정은 배정 해제가 아니라 활동 포기로 처리해야 합니다.',
  VOLUNTEER_ASSIGNMENT_SCHEDULE_REQUIRED: '활성 교육 일정이 있는 기관만 배정할 수 있습니다.',
  INSTRUCTOR_REPRESENTATIVE_NOT_CURRENT: '현재 대표 강사가 아니면 일반 강사로 변경할 수 없습니다.',
  PROGRAM_PARTICIPANT_GIVE_UP_BEFORE_FIRST_ACTIVITY:
    '첫 교육이 시작되기 전에는 활동 포기할 수 없습니다.',
  INVALID_BUSINESS_INCOME_EARNER_STATUS: '사업소득자 여부는 해당 또는 해당 없음만 저장할 수 있습니다.',
  FORBIDDEN_APPLICATION_ACTION: '이 프로그램 유형에서는 해당 작업을 할 수 없습니다.',
  FORM_RESPONSE_ALREADY_SUBMITTED:
    '이미 제출된 응답입니다. 수정은 응답 수정으로 해 주세요.',
}

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
  if (isProgramRecruitmentEditPeriodCode(code)) {
    const recruitmentMessage = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    if (recruitmentMessage && recruitmentMessage !== code) return recruitmentMessage
  }
  const editWindowMessage = programEditWindowErrorMessage(code)
  if (editWindowMessage) return editWindowMessage
  if (code === 'INVALID_PROGRAM_ASSIGNMENT_ROLE') {
    return CMS_VIEWER_PROGRAM_ROLE_ONLY_MESSAGE
  }
  if (code && PROGRESS_INSTRUCTOR_ERROR_MESSAGES[code]) {
    const raw = extractRawApiMessage(error)?.replace(/^CONFLICT:\s*/i, '').trim()
    if (raw && raw !== code) return raw
    return PROGRESS_INSTRUCTOR_ERROR_MESSAGES[code]
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
