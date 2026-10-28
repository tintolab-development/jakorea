import { beforeEach, describe, expect, it, vi } from 'vitest'

const customInstance = vi.fn()
const syncProgramInlineImagesKeepProgram = vi.fn()
const syncProgramInlineImages = vi.fn()

vi.mock('@/shared/api/orval-mutator', () => ({
  default: (...args: unknown[]) => customInstance(...args),
}))

vi.mock('@/shared/instance/axios-instance', () => ({
  axiosClient: { post: vi.fn(), delete: vi.fn() },
}))

vi.mock('@/features/program/shared/api/program-inline-images', () => ({
  syncProgramInlineImages: (...args: unknown[]) => syncProgramInlineImages(...args),
  syncProgramInlineImagesKeepProgram: (...args: unknown[]) =>
    syncProgramInlineImagesKeepProgram(...args),
}))

import { createAdminProgramRemote } from './programs-api-client'

describe('createAdminProgramRemote inline-images 실패', () => {
  beforeEach(() => {
    customInstance.mockReset()
    syncProgramInlineImagesKeepProgram.mockReset()
    syncProgramInlineImages.mockReset()
  })

  it('inline-images PUT 실패해도 생성 프로그램을 DELETE하지 않고 반환한다', async () => {
    customInstance.mockImplementation(async (config: { url?: string; method?: string }) => {
      if (config.method === 'POST' && config.url === '/api/admin/programs') {
        return { success: true, data: { id: 186359, title: '[BOT-TEST] keep' } }
      }
      if (config.method === 'DELETE') {
        throw new Error('DELETE must not run after inline-image bind failure')
      }
      return { success: true, data: {} }
    })
    syncProgramInlineImagesKeepProgram.mockResolvedValue('failed')

    const created = await createAdminProgramRemote({
      title: '[BOT-TEST] keep',
      programType: 'GENERAL_ORGANIZATION',
      description: '<img src="/api/admin/files/1/content">',
    } as never)

    expect(created.id).toBe(186359)
    expect(syncProgramInlineImagesKeepProgram).toHaveBeenCalledWith(
      186359,
      [
        expect.objectContaining({ description: '<img src="/api/admin/files/1/content">' }),
        expect.objectContaining({ id: 186359 }),
      ]
    )
    const methods = customInstance.mock.calls.map(call => call[0]?.method)
    expect(methods).not.toContain('DELETE')
  })
})
