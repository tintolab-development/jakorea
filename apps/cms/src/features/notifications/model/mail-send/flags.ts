import { MAIL_SEND_ALL_PROGRAM_ID } from './types'
import { isNotificationSendAllProgram } from '@/features/notifications/model/send-program-id'

export function isMailSendAllProgram(programId: string | undefined): boolean {
  return isNotificationSendAllProgram(programId) || programId === MAIL_SEND_ALL_PROGRAM_ID
}

/**
 * @deprecated 변수 잠금은 BE catalog `enabled` SSOT. 전체(지정 해제)도 제한 없음.
 */
export function isMailSendVariableLocked(_programId: string | undefined): boolean {
  return false
}

export function mailSendUseTemplate(templateId: string | undefined): boolean {
  return Boolean(templateId)
}
