import { describe, expect, it } from 'vitest'
import { isDataManagementListLoading } from './is-list-query-loading'

describe('isDataManagementListLoading', () => {
  it('is true while pending with no data (first load)', () => {
    expect(
      isDataManagementListLoading({ data: undefined, isError: false, isPending: true })
    ).toBe(true)
  })

  it('is false after an empty list succeeds', () => {
    expect(isDataManagementListLoading({ data: [], isError: false, isPending: false })).toBe(
      false
    )
  })

  it('is false during refetch when previous data is kept (placeholder)', () => {
    expect(
      isDataManagementListLoading({
        data: [{ id: '1' }],
        isError: false,
        isPending: false,
      })
    ).toBe(false)
  })

  it('is false on error so the spinner does not hang', () => {
    expect(
      isDataManagementListLoading({ data: undefined, isError: true, isPending: true })
    ).toBe(false)
  })

  it('falls back to data === undefined when isPending is omitted', () => {
    expect(isDataManagementListLoading({ data: undefined, isError: false })).toBe(true)
    expect(isDataManagementListLoading({ data: [], isError: false })).toBe(false)
  })
})
