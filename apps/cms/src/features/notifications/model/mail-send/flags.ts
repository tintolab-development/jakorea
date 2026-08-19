import { MAIL_SEND_ALL_PROGRAM_ID } from './types'

export function isMailSendAllProgram(programId: string | undefined): boolean {
  return programId === MAIL_SEND_ALL_PROGRAM_ID
}

export function isMailSendVariableLocked(programId: string | undefined): boolean {
  return isMailSendAllProgram(programId)
}

export function mailSendUseTemplate(templateId: string | undefined): boolean {
  return Boolean(templateId)
}
