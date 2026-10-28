import {
  getGeneralProgramApiErrorCode,
  getGeneralProgramApiErrorMessage,
} from '@/features/program/general/api/get-general-program-api-error'

/** Gemini Admin API 오류 코드 → 사용자 문구. 코드 원문은 화면에 넣지 않는다. */
export const GEMINI_API_ERROR_MESSAGES: Record<string, string> = {
  GEMINI_TRAINING_END_TIME_NOT_AFTER_START: '종료 시간은 시작 시간 이후여야 합니다.',
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
  return message || fallback
}
