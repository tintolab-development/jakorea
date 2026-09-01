export class SocialAccountNotLinkedError extends Error {
  constructor(message = '연결된 소셜 계정이 없습니다.') {
    super(message)
    this.name = 'SocialAccountNotLinkedError'
  }
}

export class SocialAccountAlreadyLinkedError extends Error {
  constructor(message = '이미 연결된 소셜 계정입니다.') {
    super(message)
    this.name = 'SocialAccountAlreadyLinkedError'
  }
}

export class SocialAuthApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'SocialAuthApiError'
    this.code = code
  }
}

export function isSocialAccountNotLinkedError(error: unknown): boolean {
  if (error instanceof SocialAccountNotLinkedError) {
    return true
  }
  if (error instanceof SocialAuthApiError) {
    return (
      error.code.includes('NOT_LINKED') ||
      error.code.includes('SOCIAL_ACCOUNT_NOT_LINKED')
    )
  }
  if (error instanceof Error) {
    return (
      error.message.includes('연결된 소셜') ||
      error.message.includes('소셜 계정') ||
      error.message.includes('SOCIAL_ACCOUNT_NOT_LINKED')
    )
  }
  return false
}

export function isSocialAccountAlreadyLinkedError(error: unknown): boolean {
  if (error instanceof SocialAccountAlreadyLinkedError) {
    return true
  }
  if (error instanceof SocialAuthApiError) {
    return (
      error.code.includes('ALREADY_LINKED') ||
      error.code.includes('SOCIAL_ACCOUNT_ALREADY_LINKED')
    )
  }
  if (error instanceof Error) {
    return (
      error.message.includes('이미 연결') ||
      error.message.includes('SOCIAL_ACCOUNT_ALREADY_LINKED')
    )
  }
  return false
}

export function parseSocialAuthApiError(payload: unknown, fallback: string): SocialAuthApiError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const code = wrapped?.code ?? (typeof o.code === 'string' ? o.code : 'UNKNOWN')
    const message =
      wrapped?.message ??
      (typeof o.message === 'string' ? o.message : undefined) ??
      fallback
    return new SocialAuthApiError(String(code), message)
  }
  return new SocialAuthApiError('UNKNOWN', fallback)
}
