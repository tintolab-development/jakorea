/** 소셜 계정이 다른 JA Korea 계정에 이미 연결되어 있을 때 */
export class SocialAccountAlreadyLinkedError extends Error {
  constructor(message = '이 소셜 계정은 이미 다른 JA Korea 계정에 연결되어 있습니다.') {
    super(message)
    this.name = 'SocialAccountAlreadyLinkedError'
  }
}

export function isSocialAccountAlreadyLinkedError(error: unknown): boolean {
  if (error instanceof SocialAccountAlreadyLinkedError) {
    return true
  }
  if (error instanceof Error) {
    return (
      error.message.includes('이미 다른') ||
      error.message.includes('SOCIAL_ACCOUNT_ALREADY_LINKED')
    )
  }
  return false
}
