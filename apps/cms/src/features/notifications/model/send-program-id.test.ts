import { describe, expect, it } from 'vitest'
import {
  canSelectNotificationSendTemplate,
  isNotificationSendWithoutProgram,
  notificationSendProgramFieldLabel,
  parseNotificationSendProgramId,
} from './send-program-id'

describe('parseNotificationSendProgramId', () => {
  it('accepts finite numeric ids', () => {
    expect(parseNotificationSendProgramId('101')).toBe(101)
    expect(parseNotificationSendProgramId(' 77 ')).toBe(77)
  })

  it('rejects empty, all, and non-numeric ids', () => {
    expect(parseNotificationSendProgramId(undefined)).toBeUndefined()
    expect(parseNotificationSendProgramId('')).toBeUndefined()
    expect(parseNotificationSendProgramId('all')).toBeUndefined()
    expect(parseNotificationSendProgramId('ALL')).toBeUndefined()
    expect(parseNotificationSendProgramId('prog-coy-2026')).toBeUndefined()
  })
})

describe('isNotificationSendWithoutProgram', () => {
  it('treats empty and all as without-program (전체회원)', () => {
    expect(isNotificationSendWithoutProgram('')).toBe(true)
    expect(isNotificationSendWithoutProgram(undefined)).toBe(true)
    expect(isNotificationSendWithoutProgram('all')).toBe(true)
    expect(isNotificationSendWithoutProgram('164003')).toBe(false)
  })
})

describe('canSelectNotificationSendTemplate', () => {
  it('allows template pick for unset, all, and specific program', () => {
    expect(canSelectNotificationSendTemplate('')).toBe(true)
    expect(canSelectNotificationSendTemplate('all')).toBe(true)
    expect(canSelectNotificationSendTemplate('164003')).toBe(true)
  })
})

describe('notificationSendProgramFieldLabel', () => {
  it('shows 미선택 for entry default (empty) and clear (all)', () => {
    expect(notificationSendProgramFieldLabel('')).toBe('미선택')
    expect(notificationSendProgramFieldLabel(undefined)).toBe('미선택')
    expect(notificationSendProgramFieldLabel('all')).toBe('미선택')
  })

  it('shows program name when a program is selected', () => {
    expect(notificationSendProgramFieldLabel('164003', 'JA COY 2026')).toBe('JA COY 2026')
  })
})
