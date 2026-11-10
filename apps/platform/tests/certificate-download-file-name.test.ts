import { describe, expect, it } from 'vitest'
import { buildCertificateDownloadFileName } from '../src/features/mypage/education/applications/lib/certificate-download-file-name'

describe('buildCertificateDownloadFileName', () => {
  const downloadedAt = new Date('2026-11-03T12:00:00+09:00')

  it('[JA Korea] 수료증_이름_YYMMDD.pdf 형식을 만든다', () => {
    expect(
      buildCertificateDownloadFileName({
        memberName: '강하은',
        downloadedAt,
      }),
    ).toBe('[JA Korea] 수료증_강하은_261103.pdf')
  })

  it('ZIP은 같은 스탬프로 확장자만 바꾼다', () => {
    expect(
      buildCertificateDownloadFileName({
        memberName: '강하은',
        downloadedAt,
        extension: 'zip',
      }),
    ).toBe('[JA Korea] 수료증_강하은_261103.zip')
  })

  it('이름이 없으면 회원으로 둔다', () => {
    expect(
      buildCertificateDownloadFileName({
        memberName: '',
        downloadedAt,
      }),
    ).toBe('[JA Korea] 수료증_회원_261103.pdf')
  })

  it('발급일이 있으면 내려받은 날짜 대신 발급일을 쓴다', () => {
    expect(
      buildCertificateDownloadFileName({
        memberName: '강하은',
        issuedAt: '2026-11-05T09:00:00+09:00',
        downloadedAt,
      }),
    ).toBe('[JA Korea] 수료증_강하은_261105.pdf')
  })
})
