import { describe, expect, it } from 'vitest'
import {
  DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CODE,
  DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CONTENT,
  getDetailedProgramApiErrorMessage,
  getDetailedProgramErrorRowId,
  isDetailedProgramConcurrentModificationError,
} from './api-errors'
import { isDetailedProgramInUseDeleteError } from './is-detailed-program-in-use-delete-error'

function axiosError(status: number, code?: string, extras?: { field?: string; details?: Record<string, string> }) {
  return {
    response: {
      status,
      data: {
        error: {
          code,
          field: extras?.field,
          details: extras?.details,
        },
      },
    },
  }
}

describe('detailed-program api errors', () => {
  it('detects concurrent modification separately from in-use delete', () => {
    const concurrent = axiosError(409, DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CODE)
    expect(isDetailedProgramConcurrentModificationError(concurrent)).toBe(true)
    expect(isDetailedProgramInUseDeleteError(concurrent)).toBe(false)
    expect(getDetailedProgramApiErrorMessage(concurrent, 'fallback')).toBe(
      DETAILED_PROGRAM_CONCURRENT_MODIFICATION_CONTENT
    )
  })

  it('still treats a generic delete 409 as in-use', () => {
    expect(isDetailedProgramInUseDeleteError(axiosError(409, 'DETAILED_PROGRAM_IN_USE'))).toBe(true)
    expect(isDetailedProgramInUseDeleteError({ response: { status: 409 } })).toBe(true)
  })

  it('maps name required and duplicate codes', () => {
    expect(
      getDetailedProgramApiErrorMessage(axiosError(400, 'DETAILED_PROGRAM_NAME_KO_REQUIRED'), 'x')
    ).toBe('세부 프로그램명을 입력해 주세요.')
    expect(
      getDetailedProgramApiErrorMessage(axiosError(409, 'DETAILED_PROGRAM_NAME_ALREADY_EXISTS'), 'x')
    ).toBe('이미 존재하는 세부 프로그램명입니다.')
  })

  it('resolves the failing row from items[index] field', () => {
    expect(
      getDetailedProgramErrorRowId(axiosError(400, 'DETAILED_PROGRAM_NAME_KO_REQUIRED', { field: 'items[1].nameKo' }), [
        { id: 10 },
        { id: 11 },
      ])
    ).toBe('11')
  })
})
