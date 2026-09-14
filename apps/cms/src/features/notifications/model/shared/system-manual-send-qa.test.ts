import { describe, expect, it } from 'vitest'
import {
  SYSTEM_MANUAL_SEND_QA_BANNER_TEXT,
  isSystemManualSendQaEnabled,
} from './system-manual-send-qa'

describe('system-manual-send-qa', () => {
  it('only enables when BE flag is strictly true', () => {
    expect(isSystemManualSendQaEnabled(true)).toBe(true)
    expect(isSystemManualSendQaEnabled(false)).toBe(false)
    expect(isSystemManualSendQaEnabled(undefined)).toBe(false)
    expect(isSystemManualSendQaEnabled(null)).toBe(false)
  })

  it('keeps TEMP banner copy for local QA', () => {
    expect(SYSTEM_MANUAL_SEND_QA_BANNER_TEXT).toContain('[TEMP QA]')
    expect(SYSTEM_MANUAL_SEND_QA_BANNER_TEXT).toContain('SYSTEM')
  })
})
