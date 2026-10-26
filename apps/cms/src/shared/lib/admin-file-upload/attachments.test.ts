import { describe, expect, it } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import {
  fileObjectIdFromAdminFileUrl,
  hydrateAxiosBlobError,
  sameOriginRawDownloadPath,
  toSameOriginApiPath,
} from '@/shared/lib/admin-file-upload/attachments'

describe('sameOriginRawDownloadPath', () => {
  it('로컬 서명 URL을 같은 출처 프록시 경로로 바꾼다', () => {
    expect(
      sameOriginRawDownloadPath(
        'http://localhost:8080/api/admin/files/downloads/raw/abc?expires=1&signature=ff',
        ''
      )
    ).toBe('/api/admin/files/downloads/raw/abc?expires=1&signature=ff')
  })

  it('절대 API 주소는 같은 출처 경로로 바꾸고 파일 id를 읽는다', () => {
    expect(
      toSameOriginApiPath(
        'http://localhost:8080/api/admin/files/12/content?x=1',
        ''
      )
    ).toBe('/api/admin/files/12/content?x=1')
    expect(toSameOriginApiPath('http://localhost:8080/api/admin/files/12/content', 'http://localhost:8080')).toBeNull()
    expect(fileObjectIdFromAdminFileUrl('/api/admin/files/12/content')).toBe(12)
    expect(fileObjectIdFromAdminFileUrl('http://localhost:8080/api/admin/files/12/download?expires=1')).toBe(12)
    expect(fileObjectIdFromAdminFileUrl('/api/admin/files/downloads/raw/abc')).toBeNull()
  })

  it('API를 직접 호출하는 환경과 S3 주소는 그대로 둔다', () => {
    const local =
      'http://localhost:8080/api/admin/files/downloads/raw/abc?expires=1&signature=ff'
    expect(sameOriginRawDownloadPath(local, 'http://localhost:8080')).toBeNull()
    expect(
      sameOriginRawDownloadPath(
        'https://bucket.s3.amazonaws.com/object?X-Amz-Signature=abc',
        ''
      )
    ).toBeNull()
  })
})

describe('hydrateAxiosBlobError', () => {
  it('blob 오류 JSON에서 error.code를 꺼낸다', async () => {
    const error = new AxiosError('Request failed')
    error.response = {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: { headers: {} } as InternalAxiosRequestConfig,
      data: new Blob(
        [JSON.stringify({ error: { code: 'SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED' } })],
        { type: 'application/json' }
      ),
    }

    const hydrated = await hydrateAxiosBlobError(error)
    expect(hydrated).toBe(error)
    expect(error.response?.data).toEqual({
      error: { code: 'SETTLEMENT_EXPORT_FILE_ALREADY_DOWNLOADED' },
    })
  })
})
