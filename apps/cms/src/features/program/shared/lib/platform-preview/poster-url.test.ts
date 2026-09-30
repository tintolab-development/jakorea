import { describe, expect, it } from 'vitest'
import {
  fileObjectIdFromAdminFileUrl,
  readablePosterUrl,
  resolvePreviewPosterSeed,
} from './poster-url'

describe('resolvePreviewPosterSeed', () => {
  it('prefers overlay thumbFileObjectId over program admin content url', () => {
    const seed = resolvePreviewPosterSeed({
      thumbObjectUrl: 'blob:http://localhost/revoked',
      thumbFileObjectId: 99,
      programKeyVisualImage: '/api/admin/files/12/content',
    })
    expect(seed.fileObjectId).toBe(99)
    expect(seed.displayUrl).toBe('blob:http://localhost/revoked')
  })

  it('rejects admin content paths as direct img src', () => {
    expect(readablePosterUrl('/api/admin/files/55/content')).toBeUndefined()
    expect(fileObjectIdFromAdminFileUrl('/api/admin/files/55/content')).toBe(55)
  })

  it('falls back to the overlay key visual file id', () => {
    const seed = resolvePreviewPosterSeed({
      overlayKeyVisualImage: '/api/admin/files/7/content',
    })
    expect(seed.fileObjectId).toBe(7)
    expect(seed.displayUrl).toBeUndefined()
  })

  it('keeps http(s) display urls when no file object id', () => {
    const seed = resolvePreviewPosterSeed({
      programKeyVisualImage: 'https://cdn.example/poster.png',
    })
    expect(seed.displayUrl).toBe('https://cdn.example/poster.png')
    expect(seed.fileObjectId).toBeUndefined()
  })
})
