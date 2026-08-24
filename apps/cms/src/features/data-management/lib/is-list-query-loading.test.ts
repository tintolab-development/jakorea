import { describe, expect, it } from 'vitest'
import { isDataManagementListLoading } from './is-list-query-loading'

describe('isDataManagementListLoading', () => {
  it('is true until the list query resolves', () => {
    expect(isDataManagementListLoading({ data: undefined, isError: false })).toBe(true)
  })

  it('is false after an empty list succeeds', () => {
    expect(isDataManagementListLoading({ data: [], isError: false })).toBe(false)
  })

  it('is false on error so the spinner does not hang', () => {
    expect(isDataManagementListLoading({ data: undefined, isError: true })).toBe(false)
  })
})
