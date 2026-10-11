import { describe, expect, it } from 'vitest'
import {
  createScopedOverlayStore,
  DEFAULT_OPERATIONAL_OVERLAY_SCOPE,
  normalizeOperationalOverlayScope,
} from './scoped-overlay-store'

describe('createScopedOverlayStore', () => {
  it('normalizes empty templateCode to the default scope', () => {
    expect(normalizeOperationalOverlayScope('')).toBe(DEFAULT_OPERATIONAL_OVERLAY_SCOPE)
    expect(normalizeOperationalOverlayScope(null)).toBe(DEFAULT_OPERATIONAL_OVERLAY_SCOPE)
    expect(normalizeOperationalOverlayScope('  custom-01  ')).toBe('custom-01')
  })

  it('keeps scope A values after switching to empty B and back', () => {
    const store = createScopedOverlayStore()
    store.setScope('form-a')
    store.patch({ 'recruitInstructor.detailInfo.html': '<p>A</p>' })

    store.setScope('form-b')
    expect(store.getRecord()['recruitInstructor.detailInfo.html']).toBeUndefined()

    store.setScope('form-a')
    expect(store.getRecord()['recruitInstructor.detailInfo.html']).toBe('<p>A</p>')
  })

  it('reset clears only the active bucket', () => {
    const store = createScopedOverlayStore()
    store.setScope('form-a')
    store.patch({ k: 'a' })
    store.setScope('form-b')
    store.patch({ k: 'b' })
    store.reset()
    expect(store.getRecord().k).toBeUndefined()
    expect(store.peekRecord('form-a').k).toBe('a')
  })

  it('resetAll clears every template bucket', () => {
    const store = createScopedOverlayStore()
    store.setScope('form-a')
    store.patch({ k: 'a' })
    store.setScope('form-b')
    store.patch({ k: 'b' })
    store.resetAll()
    expect(store.peekRecord('form-a').k).toBeUndefined()
    expect(store.peekRecord('form-b').k).toBeUndefined()
    expect(store.getRecord().k).toBeUndefined()
  })
})
