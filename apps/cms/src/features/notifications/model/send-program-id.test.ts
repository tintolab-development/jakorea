import { describe, expect, it } from 'vitest'
import {
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
