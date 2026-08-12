import { describe, expect, it } from 'vitest'
import { resolveTableBottomConsentRadioValue } from '@/features/template/lib/resolve-table-bottom-consent-radio-value'

describe('resolveTableBottomConsentRadioValue', () => {
  it('returns stored value when set', () => {
    expect(
      resolveTableBottomConsentRadioValue('disagree', {
        consentFillMode: true,
        interactive: true,
      })
    ).toBe('disagree')
  })

  it('returns null in consent fill mode when unset', () => {
    expect(
      resolveTableBottomConsentRadioValue(undefined, {
        consentFillMode: true,
        interactive: true,
      })
    ).toBeNull()
  })

  it('returns null when interactive and unset', () => {
    expect(
      resolveTableBottomConsentRadioValue(undefined, {
        consentFillMode: false,
        interactive: true,
      })
    ).toBeNull()
  })

  it('defaults to agree in readonly document view', () => {
    expect(
      resolveTableBottomConsentRadioValue(undefined, {
        consentFillMode: false,
        interactive: false,
      })
    ).toBe('agree')
  })
})
