import { describe, expect, it } from 'vitest'
import { parseNotificationSendProgramId } from './send-program-id'

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
