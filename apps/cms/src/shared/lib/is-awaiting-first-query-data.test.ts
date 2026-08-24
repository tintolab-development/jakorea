import { describe, expect, it } from 'vitest'
import { isAwaitingFirstQueryData } from './is-awaiting-first-query-data'

describe('isAwaitingFirstQueryData', () => {
  it('is true while the first fetch is in flight', () => {
    expect(
      isAwaitingFirstQueryData({
        data: undefined,
        isError: false,
        isFetching: true,
        fetchStatus: 'fetching',
      })
    ).toBe(true)
  })

  it('is false when cached data exists even if refetching', () => {
    expect(
      isAwaitingFirstQueryData({
        data: { id: '1' },
        isError: false,
        isFetching: true,
        fetchStatus: 'fetching',
      })
    ).toBe(false)
  })

  it('is false on error so the spinner does not hang', () => {
    expect(
      isAwaitingFirstQueryData({
        data: undefined,
        isError: true,
        isFetching: false,
        fetchStatus: 'idle',
      })
    ).toBe(false)
  })

  it('is false for a disabled query that has not started fetching', () => {
    expect(
      isAwaitingFirstQueryData({
        data: undefined,
        isError: false,
        isFetching: false,
        fetchStatus: 'idle',
      })
    ).toBe(false)
  })

  it('is true when the query is paused mid-flight without data', () => {
    expect(
      isAwaitingFirstQueryData({
        data: undefined,
        isError: false,
        isFetching: false,
        fetchStatus: 'paused',
      })
    ).toBe(true)
  })

  it('is true on the first enabled paint before data arrives', () => {
    expect(
      isAwaitingFirstQueryData({
        data: undefined,
        isError: false,
        isFetching: false,
        fetchStatus: 'fetching',
      })
    ).toBe(true)
  })
})
