import { describe, expect, it } from 'vitest'
import {
  SATISFACTION_RUN_MODE_ONCE_AT_END,
  SATISFACTION_RUN_MODE_PER_SCHEDULE,
  canDownloadSatisfactionResults,
  formatSatisfactionWindowExampleLine,
  mapSatisfactionProgressStatus,
  readSatisfactionRunMode,
  satisfactionBindingRowKey,
} from './satisfaction-binding-contract'

describe('satisfaction-binding-contract', () => {
  it('maps runMode from targetScope when the field is absent', () => {
    expect(readSatisfactionRunMode(undefined, 'SCHEDULE')).toBe(SATISFACTION_RUN_MODE_PER_SCHEDULE)
    expect(readSatisfactionRunMode(undefined, 'PROGRAM')).toBe(SATISFACTION_RUN_MODE_ONCE_AT_END)
    expect(readSatisfactionRunMode('ONCE_AT_END')).toBe(SATISFACTION_RUN_MODE_ONCE_AT_END)
  })

  it('trusts progressStatus instead of response counts', () => {
    expect(
      mapSatisfactionProgressStatus({ progressStatus: 'IN_PROGRESS' }, 'finished')
    ).toBe('in_progress')
    expect(mapSatisfactionProgressStatus({ progressStatus: 'FINISHED' }, 'in_progress')).toBe(
      'finished'
    )
  })

  it('always enables satisfaction result download', () => {
    expect(canDownloadSatisfactionResults({ resultDownloadable: false })).toBe(true)
    expect(canDownloadSatisfactionResults({ resultDownloadable: null })).toBe(true)
    expect(canDownloadSatisfactionResults({})).toBe(true)
    expect(canDownloadSatisfactionResults({ resultDownloadable: true })).toBe(true)
  })

  it('builds the register-modal example from the selected window days', () => {
    expect(formatSatisfactionWindowExampleLine(3)).toBe(
      '예) 1회차 11.12(목) 12:00 종료 → 11.15(일) 23:59 마감'
    )
    expect(formatSatisfactionWindowExampleLine(7)).toBe(
      '예) 1회차 11.12(목) 12:00 종료 → 11.19(목) 23:59 마감'
    )
  })

  it('keys rows by bindingId + targetScopeId, not session_no', () => {
    expect(satisfactionBindingRowKey({ bindingId: 501, targetScopeId: 3001 })).toBe('501:3001')
  })
})
