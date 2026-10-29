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

import { createAdminProgramRemote, updateAdminProgramRemote } from './programs-api-client'

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
    syncProgramInlineImagesKeepProgram.mockRejectedValue(new Error('bind failed'))

    const payload = {
      title: '[BOT-TEST] keep',
      programType: 'GENERAL_ORGANIZATION',
      description: '<img src="/api/admin/files/1/content">',
    } as never

    await expect(createAdminProgramRemote(payload)).rejects.toThrow('bind failed')
    expect(syncProgramInlineImagesKeepProgram).toHaveBeenCalledWith(186359, payload)
    const methods = customInstance.mock.calls.map(call => call[0]?.method)
    expect(methods).not.toContain('DELETE')
  })
})

describe('updateAdminProgramRemote inline-images', () => {
  beforeEach(() => {
    customInstance.mockReset()
    syncProgramInlineImagesKeepProgram.mockReset()
    syncProgramInlineImages.mockReset()
  })

  it('PATCH 응답이 아니라 저장 payload만 sync에 넘긴다', async () => {
    customInstance.mockResolvedValue({
      success: true,
      data: { id: 12, additionalContentHtml: '<img src="file-object:999" />' },
    })
    syncProgramInlineImages.mockResolvedValue(undefined)
    const payload = { additionalContentHtml: '<p></p>' }

    await updateAdminProgramRemote('12', payload as never)

    expect(syncProgramInlineImages).toHaveBeenCalledWith('12', payload)
  })

  it('이미지 연결 실패 시 수정 완료로 반환하지 않는다', async () => {
    customInstance.mockResolvedValue({ success: true, data: { id: 12 } })
    syncProgramInlineImages.mockRejectedValue(new Error('bind failed'))

    await expect(
      updateAdminProgramRemote('12', { additionalContentHtml: '<p></p>' } as never)
    ).rejects.toThrow('bind failed')
  })
})
