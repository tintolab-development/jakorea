import { describe, expect, it } from 'vitest'
import { isDynamicImportChunkError } from './lazy-load'

describe('isDynamicImportChunkError', () => {
  it('detects failed dynamic import messages', () => {
    expect(
      isDynamicImportChunkError(
        new TypeError(
          'Failed to fetch dynamically imported module: https://example/assets/page-abc.js'
        )
      )
    ).toBe(true)
  })

  it('ignores unrelated errors', () => {
    expect(isDynamicImportChunkError(new Error('Network Error'))).toBe(false)
    expect(isDynamicImportChunkError('string')).toBe(false)
  })
})
