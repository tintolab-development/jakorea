/** 상단 고정 게시글 최대 개수 (기획) */
export const IMPACT_STORY_PIN_MAX = 9

export class PinLimitError extends Error {
  readonly code = 'PIN_LIMIT' as const

  constructor(message = `상단 고정 게시글은 최대 ${IMPACT_STORY_PIN_MAX}개까지 설정 가능합니다.`) {
    super(message)
    this.name = 'PinLimitError'
  }
}

export function isPinLimitError(error: unknown): error is PinLimitError {
  return (
    error instanceof PinLimitError ||
    (typeof error === 'object' &&
      error != null &&
      'code' in error &&
      (error as { code: string }).code === 'PIN_LIMIT')
  )
}
