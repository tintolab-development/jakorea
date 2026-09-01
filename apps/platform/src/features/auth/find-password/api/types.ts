export type AccountEmailCheckPurpose = 'SIGNUP' | 'PASSWORD_RESET'

export type AccountEmailCheckRequest = {
  email: string
  purpose?: AccountEmailCheckPurpose
}

export type AccountEmailCheckResponse = {
  exists?: boolean
  available?: boolean
  message?: string
  nextAction?: string
}

export type PasswordResetConfirmRequest = {
  email: string
  identityVerificationSessionId: number
  profileToken: string
  newPassword: string
  newPasswordConfirm: string
}

export type PasswordResetConfirmResponse = {
  resetCompleted?: boolean
}
