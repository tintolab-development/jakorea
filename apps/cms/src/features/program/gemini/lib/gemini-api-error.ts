import {
  getGeneralProgramApiErrorCode,
  getGeneralProgramApiErrorMessage,
} from '@/features/program/general/api/get-general-program-api-error'

/** Gemini Admin API 오류 코드 → 사용자 문구. 코드 원문은 화면에 넣지 않는다. */
export const GEMINI_API_ERROR_MESSAGES: Record<string, string> = {
  GEMINI_TRAINING_END_TIME_NOT_AFTER_START: '종료 시각이 시작 시각보다 늦어야 합니다.',
  GEMINI_INSTRUCTOR_MATCH_AMBIGUOUS:
    '동일한 이름과 연락처의 강사가 여러 명입니다. 정확한 강사 회원을 선택해 주세요.',
  GEMINI_INSTRUCTOR_NOT_MATCHED: '입력한 강사명·연락처가 회원 정보와 일치하지 않습니다.',
  GEMINI_INSTRUCTOR_IDENTITY_MISMATCH:
    '선택한 강사 회원과 입력한 강사명·연락처가 일치하지 않습니다.',
  GEMINI_INSTRUCTOR_NAME_AND_PHONE_REQUIRED: '강사명과 연락처를 입력해 주세요.',
  GEMINI_INSTRUCTOR_WINNER_ALREADY_EXISTS:
    '이미 승인된 강사가 있습니다. 강사 변경으로 승인해 주세요.',
  GEMINI_APPROVED_TRAINING_HAS_BUSINESS_HISTORY:
    '신청 강사 또는 교육 진행 이력이 있는 연수는 삭제할 수 없습니다.',
}

function looksLikeErrorCode(value: string): boolean {
  return /^[A-Z][A-Z0-9_]{5,}$/.test(value.trim())
}

export function formatGeminiApiError(error: unknown, fallback: string): string {
  const code = getGeneralProgramApiErrorCode(error)?.trim()
  if (code && GEMINI_API_ERROR_MESSAGES[code]) return GEMINI_API_ERROR_MESSAGES[code]

  const message = getGeneralProgramApiErrorMessage(error, fallback).trim()
  for (const [errorCode, label] of Object.entries(GEMINI_API_ERROR_MESSAGES)) {
    if (message.includes(errorCode)) return label
  }
  const firstLine = message.split('\n')[0]?.trim() ?? ''
  if (looksLikeErrorCode(firstLine)) return fallback
  if (/request failed with status code \d+/i.test(message) || /status code \d+/i.test(firstLine)) {
    return fallback
  }
  return message || fallback
}
