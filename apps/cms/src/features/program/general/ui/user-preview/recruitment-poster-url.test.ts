import { describe, expect, it } from 'vitest'

/**
 * useRecruitmentPosterUrl 시드 규칙 (user-page.tsx) — blob 보다 fileObjectId 가 SSOT.
 * blob 은 StrictMode/단락 unmount 시 revoke 될 수 있다.
 */
function readablePosterUrl(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  if (!trimmed || trimmed.includes('/api/admin/files/')) return undefined
  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed
  }
  return undefined
}

function fileObjectIdFromAdminFileUrl(value: string | null | undefined): number | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  const match = trimmed.match(/\/(?:api\/admin\/)?files\/(\d+)/i)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) && id >= 1 ? id : null
}

function resolveSeed(input: {
  thumbObjectUrl?: string
  thumbFileObjectId?: number
  keyVisualImage?: string
  programKeyVisual?: string
}) {
  const displayUrl =
    readablePosterUrl(input.thumbObjectUrl) ??
    readablePosterUrl(input.programKeyVisual || input.keyVisualImage)
  const fileObjectId =
    input.thumbFileObjectId ??
    fileObjectIdFromAdminFileUrl(input.keyVisualImage) ??
    fileObjectIdFromAdminFileUrl(input.programKeyVisual) ??
    undefined
  return { displayUrl, fileObjectId }
}

describe('recruitment poster seed', () => {
  it('prefers overlay thumbFileObjectId over program admin content url', () => {
    const seed = resolveSeed({
      thumbObjectUrl: 'blob:http://localhost/revoked',
      thumbFileObjectId: 99,
      programKeyVisual: '/api/admin/files/12/content',
    })
    expect(seed.fileObjectId).toBe(99)
    expect(seed.displayUrl).toBe('blob:http://localhost/revoked')
  })

  it('rejects admin content paths as direct img src', () => {
    expect(readablePosterUrl('/api/admin/files/55/content')).toBeUndefined()
    expect(fileObjectIdFromAdminFileUrl('/api/admin/files/55/content')).toBe(55)
  })

  it('keeps http(s) display urls when no file object id', () => {
    const seed = resolveSeed({
      programKeyVisual: 'https://cdn.example/poster.png',
    })
    expect(seed.displayUrl).toBe('https://cdn.example/poster.png')
    expect(seed.fileObjectId).toBeUndefined()
  })
})
