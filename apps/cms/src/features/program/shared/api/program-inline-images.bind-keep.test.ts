import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  rememberProgramInlineImageDraft,
  resetProgramInlineImageDraftsForTests,
} from '@/shared/lib/admin-file-upload/inline-image'

const customInstance = vi.fn()
const show = vi.fn()
const uploadAdminFileMaybeMock = vi.fn()

vi.mock('@/shared/api/orval-mutator', () => ({
  default: (...args: unknown[]) => customInstance(...args),
}))

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({
  cmsAlertModal: { show: (...args: unknown[]) => show(...args), close: vi.fn() },
}))

vi.mock('@/shared/lib/admin-file-upload/upload-maybe-mock', () => ({
  uploadAdminFileMaybeMock: (...args: unknown[]) => uploadAdminFileMaybeMock(...args),
}))

import {
  ProgramInlineImageBindError,
  syncProgramInlineImages,
  syncProgramInlineImagesKeepProgram,
} from './program-inline-images'

describe('syncProgramInlineImagesKeepProgram', () => {
  beforeEach(() => {
    customInstance.mockReset()
    show.mockReset()
    uploadAdminFileMaybeMock.mockReset()
    resetProgramInlineImageDraftsForTests()
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

  it('등록 draft 본문 이미지는 프로그램 owner로 다시 올린 뒤 PUT한다', async () => {
    const draft = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    rememberProgramInlineImageDraft(9, draft)
    uploadAdminFileMaybeMock.mockResolvedValue({
      fileObjectId: 88,
      checksumSha256: 'a'.repeat(64),
    })
    customInstance.mockResolvedValue({ success: true, data: {} })

    const result = await syncProgramInlineImagesKeepProgram(186427, {
      recruitmentGuide: '<img src="/api/admin/files/9/content">',
      serviceDetailJson: JSON.stringify({
        geminiRecruitment: {
          recruitmentGuide: '<img src="/api/admin/files/9/content">',
        },
      }),
    })

    expect(result).toBe('ok')
    expect(uploadAdminFileMaybeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        file: draft,
        owner: expect.objectContaining({
          ownerId: 186427,
          filePurpose: 'PROGRAM_INLINE_IMAGE',
        }),
      })
    )
    const patchCall = customInstance.mock.calls.find(
      ([config]) => config?.method === 'PATCH' && config?.url === '/api/admin/programs/186427'
    )
    expect(patchCall?.[0]?.data?.recruitmentGuide).toBe('<img src="/api/admin/files/88/content">')
    const putCall = customInstance.mock.calls.find(
      ([config]) =>
        config?.method === 'PUT' &&
        config?.url === '/api/admin/programs/186427/inline-images'
    )
    expect(putCall?.[0]?.data).toEqual({ fileObjectIds: [88] })
    expect(show).not.toHaveBeenCalled()
  })

  it('프로그램 PATCH 본문에 없는 모집 행 이미지 id도 GET에서 모아 PUT한다', async () => {
    customInstance.mockImplementation(async (config: { method?: string; url?: string }) => {
      if (config.method === 'GET' && config.url === '/api/admin/programs/186426') {
        return {
          success: true,
          data: {
            id: 186426,
            recruitments: [
              {
                id: 186914,
                recruitmentGuide:
                  '<p><img src="/api/admin/files/2056222/content" alt="jakorea.png" /></p>',
              },
            ],
          },
        }
      }
      return { success: true, data: {} }
    })

    const result = await syncProgramInlineImagesKeepProgram(186426, {
      description: '<img src="/api/admin/files/7/content" />',
    })

    expect(result).toBe('ok')
    const putCall = customInstance.mock.calls.find(
      ([config]) =>
        config?.method === 'PUT' &&
        config?.url === '/api/admin/programs/186426/inline-images'
    )
    expect(putCall?.[0]?.data).toEqual({ fileObjectIds: [2056222, 7] })
  })

  it('저장 본문에 이미지가 없으면 inline-images PUT을 하지 않는다', async () => {
    customInstance.mockResolvedValue({ success: true, data: {} })

    const result = await syncProgramInlineImagesKeepProgram(186426, { title: '일반 기관 모집' })

    expect(result).toBe('skipped')
    expect(customInstance).not.toHaveBeenCalled()
    expect(show).not.toHaveBeenCalled()
  })

  it('draft 이미지 저장 시 프로그램 PATCH에 recruitments를 넣지 않는다', async () => {
    const draft = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })
    rememberProgramInlineImageDraft(9, draft)
    uploadAdminFileMaybeMock.mockResolvedValue({
      fileObjectId: 88,
      checksumSha256: 'a'.repeat(64),
    })
    customInstance.mockResolvedValue({ success: true, data: {} })

    const result = await syncProgramInlineImagesKeepProgram(10, [
      {
        recruitments: [
          {
            applicationType: 'INDIVIDUAL',
            recruitTerm: 'FIRST_HALF',
            recruitmentType: 'VOLUNTEER',
            recruitmentGuide: '<img src="/api/admin/files/9/content">',
          },
        ],
      },
      {
        recruitments: [
          {
            id: 186914,
            applicationType: 'INDIVIDUAL',
            recruitTerm: 'FIRST_HALF',
            recruitmentType: 'VOLUNTEER',
            recruitmentGuide: '<img src="/api/admin/files/9/content">',
          },
        ],
      },
    ])

    expect(result).toBe('ok')
    const programPatch = customInstance.mock.calls.find(
      ([config]) => config?.method === 'PATCH' && config?.url === '/api/admin/programs/10'
    )
    expect(programPatch).toBeUndefined()
    const rowPatch = customInstance.mock.calls.find(
      ([config]) =>
        config?.method === 'PATCH' &&
        config?.url === '/api/admin/programs/10/recruitments/186914'
    )
    expect(rowPatch?.[0]?.data).toEqual({
      recruitmentGuide: '<img src="/api/admin/files/88/content">',
    })
    expect(rowPatch?.[0]?.data?.recruitments).toBeUndefined()
    expect(show).not.toHaveBeenCalled()
  })

  it('UJAT_RECRUIT_TERM_DUPLICATE 는 이미지 연결 팝업을 띄우지 않는다', async () => {
    customInstance.mockRejectedValue({
      response: {
        data: {
          error: {
            code: 'UJAT_RECRUIT_TERM_DUPLICATE',
            message: '같은 상·하반기 봉사자 모집을 두 개 이상 등록할 수 없습니다.',
          },
        },
      },
    })

    const result = await syncProgramInlineImagesKeepProgram(186361, {
      description: '<img src="/api/admin/files/9/content">',
    })

    expect(result).toBe('skipped')
    expect(show).not.toHaveBeenCalled()
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
