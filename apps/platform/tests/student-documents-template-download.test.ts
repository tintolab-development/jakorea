import { describe, expect, it } from 'vitest'
import {
  extractPortraitConsentTemplateFileName,
  isPortraitConsentTemplateJobCompleted,
  isPortraitConsentTemplateJobFailed,
  isPortraitConsentTemplateJobPending,
  normalizeZipBlob,
  parseGeneratedFileJobPayload,
  parsePortalFileDownloadResolvePayload,
  PORTRAIT_CONSENT_TEMPLATE_FILE_NAME,
  PORTRAIT_CONSENT_TEMPLATE_MIME_TYPE,
} from '../src/features/mypage/education/applications/lib/student-documents-template-download'

describe('student documents portrait consent template download', () => {
  it('normalizes generated job status and envelope responses', () => {
    const queuedJob = parseGeneratedFileJobPayload({
      success: true,
      data: { id: 101, jobStatus: 'QUEUED' },
    })

    expect(queuedJob?.id).toBe(101)
    expect(isPortraitConsentTemplateJobPending(queuedJob)).toBe(true)
    expect(isPortraitConsentTemplateJobPending({ jobStatus: 'REQUESTED' })).toBe(true)
    expect(isPortraitConsentTemplateJobPending({ jobStatus: 'PROCESSING' })).toBe(true)
    expect(isPortraitConsentTemplateJobPending({ jobStatus: 'RENDERING' })).toBe(true)
    expect(isPortraitConsentTemplateJobCompleted({ jobStatus: 'COMPLETED' })).toBe(true)
    expect(isPortraitConsentTemplateJobFailed({ jobStatus: 'FAILED' })).toBe(true)
  })

  it('keeps the portal download resolve headers and server filename', () => {
    const resolved = parsePortalFileDownloadResolvePayload({
      success: true,
      data: {
        fileObjectId: 202,
        downloadUrl: 'https://storage.example/download',
        requiredHeaders: { 'x-amz-meta-purpose': 'portrait-template' },
      },
    })

    expect(resolved?.fileObjectId).toBe(202)
    expect(resolved?.requiredHeaders?.['x-amz-meta-purpose']).toBe('portrait-template')
    expect(
      extractPortraitConsentTemplateFileName({ originalFileName: '서버파일.zip' }),
    ).toBe('서버파일.zip')
    expect(extractPortraitConsentTemplateFileName({})).toBe(
      PORTRAIT_CONSENT_TEMPLATE_FILE_NAME,
    )
  })

  it('normalizes the download MIME without changing ZIP bytes', async () => {
    const zip = normalizeZipBlob(new Blob(['zip-bytes'], { type: 'application/octet-stream' }))

    expect(zip.type).toBe(PORTRAIT_CONSENT_TEMPLATE_MIME_TYPE)
    expect(await zip.text()).toBe('zip-bytes')
  })
})
