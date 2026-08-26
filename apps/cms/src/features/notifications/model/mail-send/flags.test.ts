import { describe, expect, it } from 'vitest'
import { isMailSendAllProgram, isMailSendVariableLocked, mailSendUseTemplate } from './flags'
import { MAIL_SEND_ALL_PROGRAM_ID } from './types'

describe('mailSendUseTemplate', () => {
  it('is false when no template is selected', () => {
    expect(mailSendUseTemplate(undefined)).toBe(false)
    expect(mailSendUseTemplate('')).toBe(false)
  })

  it('is true when a template id is selected', () => {
    expect(mailSendUseTemplate('mail-tpl-workshop')).toBe(true)
  })
})

describe('isMailSendVariableLocked', () => {
  it('locks variables only when the all-program option is selected', () => {
    expect(isMailSendAllProgram(MAIL_SEND_ALL_PROGRAM_ID)).toBe(true)
    expect(isMailSendVariableLocked(MAIL_SEND_ALL_PROGRAM_ID)).toBe(true)
    expect(isMailSendVariableLocked('prog-coy-2026')).toBe(false)
    expect(isMailSendVariableLocked(undefined)).toBe(false)
  })
})
