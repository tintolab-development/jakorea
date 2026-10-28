import { describe, expect, it } from 'vitest'
import { resolveProgramRegistrationAuditLabels } from './registration-audit-value'

describe('resolveProgramRegistrationAuditLabels', () => {
  it('keeps a divider partner name even when the name is missing', () => {
    expect(resolveProgramRegistrationAuditLabels(undefined, undefined)).toEqual({
      dateLabel: '-',
      nameLabel: '-',
    })
  })

  it('trims the actor name', () => {
    expect(resolveProgramRegistrationAuditLabels('2026-12-08T00:15:00.000Z', ' 곽도규 ')).toEqual({
      dateLabel: expect.stringContaining('2026.12.08'),
      nameLabel: '곽도규',
    })
  })
})
