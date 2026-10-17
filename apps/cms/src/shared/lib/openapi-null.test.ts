import { describe, expect, it } from 'vitest'
import { nullToUndefined, omitNullRecordValues } from './openapi-null'

describe('openapi-null', () => {
  describe('nullToUndefined', () => {
    it('maps null to undefined', () => {
      expect(nullToUndefined(null)).toBeUndefined()
      expect(nullToUndefined('x')).toBe('x')
      expect(nullToUndefined(undefined)).toBeUndefined()
    })
  })

  describe('omitNullRecordValues', () => {
    it('removes top-level null keys only', () => {
      expect(
        omitNullRecordValues({
          a: 1,
          b: null,
          c: '',
          d: false,
          e: 0,
        })
      ).toEqual({ a: 1, c: '', d: false, e: 0 })
    })

    it('does not recurse into nested objects', () => {
      const nested = { inner: null as string | null }
      const out = omitNullRecordValues({ top: nested, removed: null })
      expect(out).toEqual({ top: nested })
      expect(nested.inner).toBeNull()
    })
  })
})
