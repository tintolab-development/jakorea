/** @vitest-environment jsdom */
import axios, { AxiosError } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  downloadHomepageProtectedAttachment,
  fileNameFromContentDisposition,
  homepageAttachmentDownloadErrorMessage,
  homepageCorporateConsultationAttachmentUrl,
  homepageRecruitAttachmentUrl,
  homepageTalentDonationAttachmentUrl,
  HOMEPAGE_PROTECTED_ATTACHMENT_ACCEPT,
} from './protected-attachment-download'

const { request } = vi.hoisted(() => ({
  request: vi.fn(),
}))

function textBlob(contents: string, type: string): Blob {
  const bytes = new TextEncoder().encode(contents)
  return {
    type,
    size: bytes.byteLength,
    text: async () => contents,
    arrayBuffer: async () => bytes.buffer,
    slice() {
      return this
    },
  } as unknown as Blob
}

vi.mock('@/shared/instance/axios-instance', () => ({
  axiosInstance: { request },
}))

describe('homepage protected attachment urls', () => {
  it('uses asset path when assetId is present', () => {
    expect(homepageRecruitAttachmentUrl(12, 88)).toBe(
      '/api/admin/careers/talent-applications/12/attachments/88/download'
    )
    expect(homepageTalentDonationAttachmentUrl(3, 9)).toBe(
      '/api/admin/sponsorship/talent-applications/3/attachments/9/download'
    )
    expect(homepageCorporateConsultationAttachmentUrl(4, 5)).toBe(
      '/api/admin/sponsorship/corporate-consultations/4/attachments/5/download'
    )
  })

  it('falls back to attachment-download when assetId is missing', () => {
    expect(homepageRecruitAttachmentUrl(12)).toBe(
      '/api/admin/careers/talent-applications/12/attachment-download'
    )
    expect(homepageTalentDonationAttachmentUrl(3, null)).toBe(
      '/api/admin/sponsorship/talent-applications/3/attachment-download'
    )
    expect(homepageCorporateConsultationAttachmentUrl(4)).toBe(
      '/api/admin/sponsorship/corporate-consultations/4/attachment-download'
    )
  })
})

describe('fileNameFromContentDisposition', () => {
  it('prefers RFC 5987 filename* UTF-8 over ASCII filename', () => {
    expect(
      fileNameFromContentDisposition(
        'attachment; filename="resume.pdf"; filename*=UTF-8\'\'%ED%95%9C%EA%B8%80.pdf',
        'fallback.pdf'
      )
    ).toBe('한글.pdf')
  })
})

describe('downloadHomepageProtectedAttachment', () => {
  beforeEach(() => {
    request.mockReset()
    vi.stubGlobal(
      'URL',
      class {
        static createObjectURL = vi.fn(() => 'blob:protected-attachment')
        static revokeObjectURL = vi.fn()
      }
    )
  })

  it('POSTs JSON password and saves the encrypted blob with Content-Disposition name', async () => {
    const blob = textBlob('%PDF-encrypted', 'application/pdf')
    const click = vi.fn()
    const anchor = {
      href: '',
      download: '',
      rel: '',
      click,
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    vi.spyOn(document.body, 'appendChild').mockImplementation(node => node)

    request.mockResolvedValue({
      data: blob,
      status: 200,
      headers: {
        'content-disposition':
          'attachment; filename="resume.pdf"; filename*=UTF-8\'\'%EC%9E%90%EA%B8%B0%EC%86%8C%EA%B0%9C.pdf',
      },
    })

    await downloadHomepageProtectedAttachment({
      url: '/api/admin/sponsorship/talent-applications/3/attachments/9/download',
      password: 'Jafile1!',
      fallbackFileName: 'fallback.pdf',
    })

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        responseType: 'blob',
        headers: expect.objectContaining({
          Accept: HOMEPAGE_PROTECTED_ATTACHMENT_ACCEPT,
          'Content-Type': 'application/json',
        }),
        data: { password: 'Jafile1!' },
      })
    )
    expect(request.mock.calls[0]?.[0]?.method).not.toBe('GET')
    expect(anchor.download).toBe('자기소개.pdf')
    expect(click).toHaveBeenCalled()
    expect(request.mock.calls[0]?.[0]).not.toEqual(
      expect.objectContaining({ params: expect.anything() })
    )
  })

  it('rejects 200 JSON downloadUrl instead of following it', async () => {
    request.mockResolvedValue({
      data: textBlob(
        JSON.stringify({ downloadUrl: 'https://example.test/file.pdf' }),
        'application/json'
      ),
      status: 200,
      headers: {},
    })

    await expect(
      downloadHomepageProtectedAttachment({
        url: '/api/admin/sponsorship/corporate-consultations/4/attachments/5/download',
        password: 'Jafile1!',
        fallbackFileName: 'file.pdf',
      })
    ).rejects.toThrow('암호화된 파일을 받지 못했습니다.')
  })

  it('parses 400 blob JSON and keeps the server message', async () => {
    const error = new AxiosError('Bad Request')
    error.config = { headers: {}, data: { password: 'Jafile1!' } } as AxiosError['config']
    error.response = {
      data: textBlob(
        JSON.stringify({
          code: 'VALIDATION_ERROR',
          message: '파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.',
        }),
        'application/json'
      ),
      status: 400,
      statusText: 'Bad Request',
      headers: {},
      config: error.config!,
    }
    request.mockRejectedValue(error)

    try {
      await downloadHomepageProtectedAttachment({
        url: '/api/admin/careers/talent-applications/12/attachments/88/download',
        password: 'Jafile1!',
        fallbackFileName: 'resume.pdf',
      })
      throw new Error('expected download to fail')
    } catch (rejected) {
      expect(homepageAttachmentDownloadErrorMessage(rejected, 'fallback')).toBe(
        '파일 암호는 8자 이상이며 영문, 숫자, 특수문자를 포함하고 공백이 없어야 합니다.'
      )
      expect(axios.isAxiosError(rejected)).toBe(true)
      if (axios.isAxiosError(rejected)) {
        expect((rejected.config?.data as { password?: string } | undefined)?.password).toBe(
          '[REDACTED]'
        )
      }
    }
  })
})
