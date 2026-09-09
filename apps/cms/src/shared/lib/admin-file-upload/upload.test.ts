import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  confirmUpload,
  copyRequiredHeaders,
  createUploadRequest,
  getFileStatus,
  uploadAdminFile,
  uploadToS3,
  waitUntilFileAvailable,
} from '@/shared/lib/admin-file-upload/upload'
import { createSha256 } from '@/shared/lib/admin-file-upload/create-sha256'

vi.mock('@/shared/api/orval-mutator', () => ({
  customInstance: vi.fn(),
}))

import { customInstance } from '@/shared/api/orval-mutator'

const OWNER = {
  ownerDomain: 'PROGRAM',
  ownerType: 'APPLICATION',
  ownerId: 10001,
  privacyLevel: 'NORMAL',
} as const

function wrapData<T>(data: T) {
  return { success: true, data }
}

describe('admin file upload', () => {
  beforeEach(() => {
    vi.mocked(customInstance).mockReset()
    global.fetch = vi.fn() as typeof fetch
  })

  it('uploadToS3는 requiredHeaders만 넣고 Authorization·credentials를 붙이지 않는다', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response)

    const file = new File(['pdf'], 'form.pdf', { type: 'application/pdf' })
    await uploadToS3(
      'https://s3.example/upload',
      file,
      {
        'Content-Type': 'application/pdf',
        'x-amz-meta-checksum-sha256': 'abc',
      },
      'PUT'
    )

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, init] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(url).toBe('https://s3.example/upload')
    expect(init?.method).toBe('PUT')
    expect(init?.credentials).toBe('omit')
    expect(init?.mode).toBe('cors')
    expect(init?.headers).toEqual({
      'Content-Type': 'application/pdf',
      'x-amz-meta-checksum-sha256': 'abc',
    })
    expect(init?.headers).not.toHaveProperty('Authorization')
  })

  it('copyRequiredHeaders는 문자열 헤더만 그대로 복사한다', () => {
    expect(
      copyRequiredHeaders({
        'Content-Type': 'application/pdf',
        'x-amz-meta-checksum-sha256': 'abc',
      })
    ).toEqual({
      'Content-Type': 'application/pdf',
      'x-amz-meta-checksum-sha256': 'abc',
    })
    expect(copyRequiredHeaders(undefined)).toEqual({})
  })

  it('uploadToS3는 CORS/네트워크 실패를 S3 PUT 실패로 구분한다', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))
    const file = new File(['pdf'], 'form.pdf', { type: 'application/pdf' })
    await expect(
      uploadToS3('https://s3.example/upload', file, { 'Content-Type': 'application/pdf' })
    ).rejects.toThrow('Presigned URL CORS')
  })

  it('uploadToS3는 상대 경로 uploadUrl을 거부한다', async () => {
    const file = new File(['pdf'], 'form.pdf', { type: 'application/pdf' })
    await expect(
      uploadToS3('/prod/quarantine/key', file, { 'Content-Type': 'application/pdf' })
    ).rejects.toThrow('Presigned upload URL이 올바르지 않습니다.')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('uploadToS3는 파일 MIME과 서명 Content-Type이 다르면 body type을 맞춘다', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response)
    const file = new File(['png'], 'scan.png', { type: 'image/png' })
    await uploadToS3('https://s3.example/upload', file, { 'Content-Type': 'application/octet-stream' })
    const body = vi.mocked(fetch).mock.calls[0]?.[1]?.body as Blob
    expect(body).toBeInstanceOf(Blob)
    expect(body).not.toBe(file)
    expect(body.type).toBe('application/octet-stream')
  })

  it('uploadToS3는 S3 204도 성공으로 본다', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 204 } as Response)
    const file = new File(['pdf'], 'form.pdf', { type: 'application/pdf' })
    await expect(
      uploadToS3('https://s3.example/upload', file, { 'Content-Type': 'application/pdf' })
    ).resolves.toBeUndefined()
  })

  it('createUploadRequest는 checksumSha256과 Idempotency-Key를 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue(
      wrapData({
        fileObjectId: '101',
        uploadUrl: 'https://s3.example/upload',
        method: 'PUT',
        requiredHeaders: { 'Content-Type': 'application/pdf' },
        confirmPath: '/api/admin/files/101/confirm',
      })
    )

    const prepared = await createUploadRequest({
      owner: OWNER,
      originalFileName: 'application-form.pdf',
      contentType: 'application/pdf',
      fileSize: 204800,
      checksumSha256: 'SHA256_VALUE',
      idempotencyKey: 'idem-1',
    })

    expect(prepared.fileObjectId).toBe('101')
    expect(customInstance).toHaveBeenCalledTimes(1)
    const config = vi.mocked(customInstance).mock.calls[0]?.[0]
    expect(config?.url).toBe('/api/admin/files/upload-requests')
    expect(config?.method).toBe('POST')
    expect(config?.data).toMatchObject({
      ownerDomain: 'PROGRAM',
      ownerType: 'APPLICATION',
      ownerId: 10001,
      filePurpose: 'NORMAL',
      originalFileName: 'application-form.pdf',
      contentType: 'application/pdf',
      fileSize: 204800,
      checksumSha256: 'SHA256_VALUE',
    })
    expect(config?.headers).toMatchObject({ 'Idempotency-Key': 'idem-1' })
  })

  it('confirmUpload는 최초 요청과 같은 fileSize·checksum·contentType을 보낸다', async () => {
    vi.mocked(customInstance).mockResolvedValue(
      wrapData({
        fileObjectId: 101,
        scanStatus: 'PENDING_SCAN',
        uploadStatus: 'CONFIRM_REQUESTED',
      })
    )

    await confirmUpload({
      fileObjectId: 101,
      confirmPath: '/api/admin/files/101/confirm',
      fileSize: 204800,
      checksumSha256: 'SHA256_VALUE',
      contentType: 'application/pdf',
    })

    const config = vi.mocked(customInstance).mock.calls[0]?.[0]
    expect(config?.url).toBe('/api/admin/files/101/confirm')
    expect(config?.data).toEqual({
      fileSize: 204800,
      checksumSha256: 'SHA256_VALUE',
      contentType: 'application/pdf',
    })
  })

  it('waitUntilFileAvailable은 CLEAN+AVAILABLE이면 반환한다', async () => {
    vi.mocked(customInstance).mockResolvedValue(
      wrapData({
        fileObjectId: 101,
        scanStatus: 'CLEAN',
        uploadStatus: 'AVAILABLE',
      })
    )

    const file = await waitUntilFileAvailable(101, { maxAttempts: 3, intervalMs: 0 })
    expect(file.scanStatus).toBe('CLEAN')
    expect(file.uploadStatus).toBe('AVAILABLE')
    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/admin/files/101',
        method: 'GET',
      })
    )
  })

  it('waitUntilFileAvailable은 INFECTED면 실패한다', async () => {
    vi.mocked(customInstance).mockResolvedValue(
      wrapData({
        fileObjectId: 101,
        scanStatus: 'INFECTED',
        uploadStatus: 'QUARANTINED',
      })
    )

    await expect(waitUntilFileAvailable(101, { maxAttempts: 2, intervalMs: 0 })).rejects.toThrow(
      '파일 검사 실패'
    )
  })

  it('waitUntilFileAvailable은 PENDING 후 CLEAN이 되면 성공한다', async () => {
    vi.mocked(customInstance)
      .mockResolvedValueOnce(
        wrapData({
          fileObjectId: 101,
          scanStatus: 'PENDING_SCAN',
          uploadStatus: 'UPLOADED',
        })
      )
      .mockResolvedValueOnce(
        wrapData({
          fileObjectId: 101,
          scanStatus: 'CLEAN',
          uploadStatus: 'AVAILABLE',
        })
      )

    const sleep = vi.fn().mockResolvedValue(undefined)
    const file = await waitUntilFileAvailable(101, { maxAttempts: 5, intervalMs: 10, sleep })
    expect(file.uploadStatus).toBe('AVAILABLE')
    expect(sleep).toHaveBeenCalledTimes(1)
  })

  it('getFileStatus는 파일 객체 조회 경로를 호출한다', async () => {
    vi.mocked(customInstance).mockResolvedValue(
      wrapData({ fileObjectId: 101, scanStatus: 'PENDING_SCAN', uploadStatus: 'PREPARED' })
    )
    await getFileStatus(101)
    expect(customInstance).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/admin/files/101', method: 'GET' })
    )
  })

  it('uploadAdminFile은 request → S3 PUT → confirm → 상태 조회를 수행한다', async () => {
    const file = new File(['xy'], 'application-form.pdf', { type: 'application/pdf' })
    const checksumSha256 = await createSha256(file)

    vi.mocked(customInstance)
      .mockResolvedValueOnce(
        wrapData({
          fileObjectId: '101',
          uploadUrl: 'https://s3.example/upload',
          method: 'PUT',
          requiredHeaders: {
            'Content-Type': 'application/pdf',
            'x-amz-meta-checksum-sha256': checksumSha256,
          },
          confirmPath: '/api/admin/files/101/confirm',
        })
      )
      .mockResolvedValueOnce(wrapData({ fileObjectId: 101 }))
      .mockResolvedValueOnce(
        wrapData({
          fileObjectId: 101,
          scanStatus: 'CLEAN',
          uploadStatus: 'AVAILABLE',
        })
      )
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response)

    const phases: string[] = []
    const result = await uploadAdminFile({
      file,
      owner: OWNER,
      onPhaseChange: phase => {
        phases.push(phase)
      },
    })

    expect(result.fileObjectId).toBe(101)
    expect(result.checksumSha256).toBe(checksumSha256)
    expect(result.file?.scanStatus).toBe('CLEAN')
    expect(result.file?.uploadStatus).toBe('AVAILABLE')
    expect(phases).toEqual(['HASHING', 'UPLOADING', 'CONFIRMING', 'SCANNING', 'SUCCESS'])

    expect(vi.mocked(customInstance).mock.calls[0]?.[0]?.url).toBe(
      '/api/admin/files/upload-requests'
    )
    expect(vi.mocked(customInstance).mock.calls[0]?.[0]?.data).toMatchObject({ checksumSha256 })
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetch).mock.calls[0]?.[0]).toBe('https://s3.example/upload')
    expect(vi.mocked(fetch).mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        method: 'PUT',
        credentials: 'omit',
        mode: 'cors',
      })
    )
    const s3Headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(s3Headers.Authorization).toBeUndefined()
    expect(s3Headers['Content-Type']).toBe('application/pdf')
    expect(vi.mocked(customInstance).mock.calls[1]?.[0]?.url).toBe('/api/admin/files/101/confirm')
    expect(vi.mocked(customInstance).mock.calls[1]?.[0]?.data).toMatchObject({ checksumSha256 })
    expect(vi.mocked(customInstance).mock.calls[2]?.[0]?.url).toBe('/api/admin/files/101')
  })

  it('confirm 응답이 이미 CLEAN+AVAILABLE이면 추가 상태 폴링을 생략한다', async () => {
    const file = new File(['xy'], 'application-form.pdf', { type: 'application/pdf' })

    vi.mocked(customInstance)
      .mockResolvedValueOnce(
        wrapData({
          fileObjectId: '101',
          uploadUrl: 'https://s3.example/upload',
          method: 'PUT',
          requiredHeaders: { 'Content-Type': 'application/pdf' },
        })
      )
      .mockResolvedValueOnce(
        wrapData({
          fileObjectId: 101,
          scanStatus: 'CLEAN',
          uploadStatus: 'AVAILABLE',
        })
      )
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response)

    const phases: string[] = []
    await uploadAdminFile({
      file,
      owner: OWNER,
      onPhaseChange: phase => {
        phases.push(phase)
      },
    })

    expect(phases).toEqual(['HASHING', 'UPLOADING', 'CONFIRMING', 'SUCCESS'])
    expect(customInstance).toHaveBeenCalledTimes(2)
  })

  it('waitUntilAvailable=false면 confirm 후 상태 조회를 하지 않는다', async () => {
    const file = new File(['xy'], 'notice.png', { type: 'image/png' })

    vi.mocked(customInstance)
      .mockResolvedValueOnce(
        wrapData({
          fileObjectId: '101',
          uploadUrl: 'https://s3.example/upload',
          method: 'PUT',
          requiredHeaders: { 'Content-Type': 'image/png' },
        })
      )
      .mockResolvedValueOnce(wrapData({ fileObjectId: 101, scanStatus: 'PENDING_SCAN' }))
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response)

    const result = await uploadAdminFile({ file, owner: OWNER, waitUntilAvailable: false })
    expect(result.fileObjectId).toBe(101)
    expect(customInstance).toHaveBeenCalledTimes(2)
  })

  it('S3 PUT 실패 시 confirm을 호출하지 않는다', async () => {
    vi.mocked(customInstance).mockResolvedValueOnce(
      wrapData({
        fileObjectId: '101',
        uploadUrl: 'https://s3.example/upload',
        method: 'PUT',
        requiredHeaders: { 'Content-Type': 'application/pdf' },
      })
    )
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403 } as Response)

    const file = new File(['xy'], 'form.pdf', { type: 'application/pdf' })
    await expect(uploadAdminFile({ file, owner: OWNER })).rejects.toThrow('S3 파일 업로드 실패: 403')
    expect(customInstance).toHaveBeenCalledTimes(1)
  })

  it('S3 PUT CORS 실패 시 confirm을 호출하지 않는다', async () => {
    vi.mocked(customInstance).mockResolvedValueOnce(
      wrapData({
        fileObjectId: '101',
        uploadUrl: 'https://s3.example/upload',
        method: 'PUT',
        requiredHeaders: { 'Content-Type': 'application/pdf' },
      })
    )
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    const file = new File(['xy'], 'form.pdf', { type: 'application/pdf' })
    await expect(uploadAdminFile({ file, owner: OWNER })).rejects.toThrow('Presigned URL CORS')
    expect(customInstance).toHaveBeenCalledTimes(1)
  })
})
