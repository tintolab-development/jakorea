import { formatGeminiApiError } from '../gemini-api-error'

const DEFAULT_SAVE_MESSAGE =
  '모집 정보 저장에 실패했습니다.\n잠시 후 다시 시도해 주세요.'

const DEFAULT_REGISTER_MESSAGE =
  '모집 공고 등록에 실패했습니다.\n입력값과 서버 상태를 확인한 뒤 다시 시도해 주세요.'

export function formatGeminiRecruitmentMutationError(
  error: unknown,
  fallback: string
): string {
  return formatGeminiApiError(error, fallback)
}

export function formatGeminiRecruitmentSaveError(error: unknown): string {
  return formatGeminiRecruitmentMutationError(error, DEFAULT_SAVE_MESSAGE)
}

export function formatGeminiRecruitmentRegisterError(error: unknown): string {
  return formatGeminiRecruitmentMutationError(error, DEFAULT_REGISTER_MESSAGE)
}

