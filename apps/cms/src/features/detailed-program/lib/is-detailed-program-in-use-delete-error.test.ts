import { describe, expect, it } from 'vitest'
import {
  DETAILED_PROGRAM_IN_USE_CODE,
  isDetailedProgramInUseDeleteError,
} from './is-detailed-program-in-use-delete-error'

describe('isDetailedProgramInUseDeleteError', () => {
  it('detects assertBulkDeleteSucceeded Error message', () => {
    expect(isDetailedProgramInUseDeleteError(new Error(DETAILED_PROGRAM_IN_USE_CODE))).toBe(true)
  })

  it('detects HTTP 409', () => {
    expect(isDetailedProgramInUseDeleteError({ response: { status: 409 } })).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isDetailedProgramInUseDeleteError(new Error('NETWORK'))).toBe(false)
    expect(isDetailedProgramInUseDeleteError({ response: { status: 500 } })).toBe(false)
  })
})
