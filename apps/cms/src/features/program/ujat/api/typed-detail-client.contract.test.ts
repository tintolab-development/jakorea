import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/orval-mutator', () => ({
  default: request,
}))

import {
  fetchUjatTypedDetailRemote,
  patchUjatTypedDetailRemote,
  replaceUjatTypedDetailRemote,
} from './typed-detail-client'

describe('UJAT Typed detail HTTP contract', () => {
  beforeEach(() => {
    request.mockReset()
    request.mockResolvedValue({ schemaVersion: 1, halfPlans: [], common: null })
  })

  it('GET uses the backend typed-detail route and returns the raw DTO', async () => {
    await fetchUjatTypedDetailRemote('186264')

    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186264/ujat/typed-detail',
      method: 'GET',
    })
  })

  it('PUT sends the complete typed document without a legacy overlay envelope', async () => {
    const detail = { schemaVersion: 1, halfPlans: [], common: null }
    await replaceUjatTypedDetailRemote('186264', detail)

    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186264/ujat/typed-detail',
      method: 'PUT',
      data: detail,
    })
  })

  it('PATCH uses JSON Merge Patch semantics', async () => {
    const patch = { common: { surveySettings: [] } }
    await patchUjatTypedDetailRemote('186264', patch)

    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186264/ujat/typed-detail',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      data: patch,
    })
  })
})
