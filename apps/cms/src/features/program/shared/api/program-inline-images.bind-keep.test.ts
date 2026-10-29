import { beforeEach, describe, expect, it, vi } from 'vitest'

const customInstance = vi.fn()

vi.mock('@/shared/api/orval-mutator', () => ({
  default: (...args: unknown[]) => customInstance(...args),
}))

import {
  ProgramInlineImageBindError,
  syncProgramInlineImages,
  syncProgramInlineImagesKeepProgram,
} from './program-inline-images'

describe('syncProgramInlineImagesKeepProgram', () => {
  beforeEach(() => {
    customInstance.mockReset()
  })

  it('403 INLINE_IMAGE_FILE_OWNER_MISMATCH 를 성공으로 숨기지 않고 throw한다', async () => {
    customInstance.mockRejectedValue({
      response: {
        status: 403,
        data: {
          error: {
            code: 'INLINE_IMAGE_FILE_OWNER_MISMATCH',
            message: '파일 소유자가 프로그램과 다릅니다.',
          },
        },
      },
    })

    await expect(
      syncProgramInlineImagesKeepProgram(186361, {
        description: '<img src="/api/admin/files/9/content">',
      })
    ).rejects.toBeInstanceOf(ProgramInlineImageBindError)

    try {
      await syncProgramInlineImagesKeepProgram(186361, {
        description: '<img src="/api/admin/files/9/content">',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ProgramInlineImageBindError)
      expect((error as ProgramInlineImageBindError).message).toContain('권한이 없습니다')
      expect((error as ProgramInlineImageBindError).stage).toBe('create')
    }
  })

  it('생성 요청 본문만 모아 PUT하고 PATCH echo는 쓰지 않는다', async () => {
    customInstance.mockResolvedValue({ success: true, data: { fileObjectIds: [9] } })

    await syncProgramInlineImagesKeepProgram(12, {
      additionalContentHtml: '<img src="file-object:9" />',
      keyVisualImage: '/api/admin/files/100/content',
    })

    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/admin/programs/12/inline-images',
        method: 'PUT',
        data: { fileObjectIds: [9] },
      })
    )
  })
})

describe('syncProgramInlineImages', () => {
  beforeEach(() => {
    customInstance.mockReset()
  })

  it('본문 이미지가 없으면 빈 배열을 PUT한다', async () => {
    customInstance.mockResolvedValue({ success: true, data: { fileObjectIds: [] } })

    await syncProgramInlineImages(12, { additionalContentHtml: '<p></p>' })

    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'PUT',
        data: { fileObjectIds: [] },
      })
    )
  })

  it('409 INLINE_IMAGE_FILE_NOT_AVAILABLE 은 부분 저장 안내와 함께 throw한다', async () => {
    customInstance.mockRejectedValue({
      response: {
        status: 409,
        data: {
          error: {
            code: 'INLINE_IMAGE_FILE_NOT_AVAILABLE',
            message: '파일이 아직 사용할 수 없습니다.',
          },
        },
      },
    })

    await expect(
      syncProgramInlineImages(12, {
        additionalContentHtml: '<img src="file-object:3" />',
      })
    ).rejects.toMatchObject({
      name: 'ProgramInlineImageBindError',
      stage: 'update',
    })
  })
})
