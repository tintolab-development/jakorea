/**
 * MFA 검증 등 로그인 완료 후 이동 경로.
 * 임시 비밀번호 변경이 필요하면 대시보드 대신 안내·변경 화면으로 보낸다.
 */

export const PASSWORD_CHANGE_REQUIRED_PATH = '/auth/password-change-required'

export const passwordChangeRequiredPaths = {
  notice: PASSWORD_CHANGE_REQUIRED_PATH,
  birth: `${PASSWORD_CHANGE_REQUIRED_PATH}/birth`,
  identity: `${PASSWORD_CHANGE_REQUIRED_PATH}/identity`,
  identityCallback: `${PASSWORD_CHANGE_REQUIRED_PATH}/identity/callback`,
  identityMock: `${PASSWORD_CHANGE_REQUIRED_PATH}/identity/mock`,
  changePassword: `${PASSWORD_CHANGE_REQUIRED_PATH}/change-password`,
} as const

export function resolvePostAuthRedirectPath(options: {
  passwordChangeRequired?: boolean | null
  fallbackPath: string
}): string {
  if (options.passwordChangeRequired === true) {
    return PASSWORD_CHANGE_REQUIRED_PATH
  }
  return options.fallbackPath
}
