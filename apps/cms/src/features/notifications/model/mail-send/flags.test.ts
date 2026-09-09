import { describe, expect, it } from 'vitest'
import { isMailSendAllProgram, isMailSendVariableLocked, mailSendUseTemplate } from './flags'
import { MAIL_SEND_ALL_PROGRAM_ID } from './types'

describe('isMailSendAllProgram', () => {
  it('recognizes all sentinel', () => {
    expect(isMailSendAllProgram(MAIL_SEND_ALL_PROGRAM_ID)).toBe(true)
    expect(isMailSendAllProgram('101')).toBe(false)
    expect(isMailSendAllProgram(undefined)).toBe(false)
    expect(isMailSendAllProgram('')).toBe(false)
  })
})

describe('isMailSendVariableLocked', () => {
  it('does not lock variables for all program (catalog enabled is SSOT)', () => {
    expect(isMailSendVariableLocked(MAIL_SEND_ALL_PROGRAM_ID)).toBe(false)
    expect(isMailSendVariableLocked('prog-coy-2026')).toBe(false)
    expect(isMailSendVariableLocked(undefined)).toBe(false)
  })
})

describe('mailSendUseTemplate', () => {
  it('is true when templateId present', () => {
    expect(mailSendUseTemplate('1')).toBe(true)
    expect(mailSendUseTemplate(undefined)).toBe(false)
  })
})
