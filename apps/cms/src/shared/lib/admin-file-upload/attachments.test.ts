import { describe, expect, it } from 'vitest'
import { sameOriginRawDownloadPath } from '@/shared/lib/admin-file-upload/attachments'

describe('sameOriginRawDownloadPath', () => {
  it('로컬 서명 URL을 같은 출처 프록시 경로로 바꾼다', () => {
    expect(
      sameOriginRawDownloadPath(
        'http://localhost:8080/api/admin/files/downloads/raw/abc?expires=1&signature=ff',
        ''
      )
    ).toBe('/api/admin/files/downloads/raw/abc?expires=1&signature=ff')
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
