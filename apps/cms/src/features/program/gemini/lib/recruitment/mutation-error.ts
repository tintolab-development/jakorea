import {
  getGeneralProgramApiErrorCode,
  getGeneralProgramApiErrorMessage,
} from '@/features/program/general/api/get-general-program-api-error'

const DEFAULT_SAVE_MESSAGE =
  '모집 정보 저장에 실패했습니다.\n잠시 후 다시 시도해 주세요.'

const DEFAULT_REGISTER_MESSAGE =
  '모집 공고 등록에 실패했습니다.\n입력값과 서버 상태를 확인한 뒤 다시 시도해 주세요.'

const DEFAULT_DRAFT_MESSAGE =
  '임시 저장에 실패했습니다.\n입력값과 서버 상태를 확인한 뒤 다시 시도해 주세요.'

export function formatGeminiRecruitmentMutationError(
  error: unknown,
  fallback: string
): string {
  const message = getGeneralProgramApiErrorMessage(error, fallback)
  const code = getGeneralProgramApiErrorCode(error)?.trim()
  if (code && !message.includes(code)) {
    return `${message}\n(${code})`
  }
  return message
}

export function formatGeminiRecruitmentSaveError(error: unknown): string {
  return formatGeminiRecruitmentMutationError(error, DEFAULT_SAVE_MESSAGE)
}

export function formatGeminiRecruitmentRegisterError(error: unknown): string {
  return formatGeminiRecruitmentMutationError(error, DEFAULT_REGISTER_MESSAGE)
}

export function formatGeminiRecruitmentDraftError(error: unknown): string {
  return formatGeminiRecruitmentMutationError(error, DEFAULT_DRAFT_MESSAGE)
}
