import { describe, expect, it } from 'vitest'
import {
  getQueryRetryHttpStatus,
  queryRetryDelay,
  shouldRetryQuery,
} from './query-retry'

describe('getQueryRetryHttpStatus', () => {
  it('reads Axios-shaped response.status', () => {
    expect(getQueryRetryHttpStatus({ response: { status: 404 } })).toBe(404)
  })

  it('returns undefined when status is missing', () => {
    expect(getQueryRetryHttpStatus(new Error('network'))).toBeUndefined()
    expect(getQueryRetryHttpStatus(null)).toBeUndefined()
  })
})

describe('shouldRetryQuery', () => {
  it('does not retry 4xx that must not be retried', () => {
    expect(shouldRetryQuery(0, { response: { status: 400 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 401 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 403 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 404 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 409 } })).toBe(false)
    expect(shouldRetryQuery(0, { response: { status: 422 } })).toBe(false)
  })

  it('retries other errors up to twice', () => {
    expect(shouldRetryQuery(0, { response: { status: 500 } })).toBe(true)
    expect(shouldRetryQuery(1, { response: { status: 500 } })).toBe(true)
    expect(shouldRetryQuery(2, { response: { status: 500 } })).toBe(false)
    expect(shouldRetryQuery(0, new Error('offline'))).toBe(true)
  })
})

describe('queryRetryDelay', () => {
  it('caps exponential backoff at 10s', () => {
    expect(queryRetryDelay(0)).toBe(1000)
    expect(queryRetryDelay(1)).toBe(2000)
    expect(queryRetryDelay(10)).toBe(10_000)
  })
})
