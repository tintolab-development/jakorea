import { beforeEach, describe, expect, it, vi } from 'vitest'

const customInstance = vi.fn()
const show = vi.fn()

vi.mock('@/shared/api/orval-mutator', () => ({
  default: (...args: unknown[]) => customInstance(...args),
}))

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: (...args: unknown[]) => show(...args), close: vi.fn() },
}))

import { syncProgramInlineImagesKeepProgram } from './program-inline-images'

describe('syncProgramInlineImagesKeepProgram', () => {
  beforeEach(() => {
    customInstance.mockReset()
    show.mockReset()
  })

  it('403 INLINE_IMAGE_FILE_OWNER_MISMATCH 에서도 throw하지 않고 재시도 안내를 띄운다', async () => {
    customInstance.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'INLINE_IMAGE_FILE_OWNER_MISMATCH',
            message: '파일 소유자가 프로그램과 다릅니다.',
          },
        },
      },
    })

    const result = await syncProgramInlineImagesKeepProgram(186361, {
      description: '<img src="/api/admin/files/9/content">',
    })

    expect(result).toBe('failed')
    expect(show).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '이미지 연결 실패',
        confirmLabel: '다시 시도',
      })
    )
  })
})
