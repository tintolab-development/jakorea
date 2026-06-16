/** 소셜 계정과 연결된 JA Korea 계정이 없을 때 */
export class SocialAccountNotLinkedError extends Error {
  constructor(message = '연결된 소셜 계정이 없습니다.') {
    super(message)
    this.name = 'SocialAccountNotLinkedError'
  }
}

export function isSocialAccountNotLinkedError(error: unknown): boolean {
  if (error instanceof SocialAccountNotLinkedError) {
    return true
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
