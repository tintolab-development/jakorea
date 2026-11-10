import { describe, expect, it } from 'vitest'
import { buildActivityCertificateFileName } from './build-activity-certificate-issuance-preview'
import { buildPortraitConsentDownloadFileName } from './build-portrait-consent-download'

describe('buildActivityCertificateFileName', () => {
  it('[JA Korea] 파일유형명_발급대상자명_YYMMDD 규칙을 따른다', () => {
    expect(buildActivityCertificateFileName('김서연', new Date(2026, 5, 5))).toBe(
      '[JA Korea] 활동인증서_김서연_260605'
    )
  })

  it('이름의 빗금은 쉼표로 바꾼다', () => {
    expect(buildActivityCertificateFileName('김/서연', new Date(2026, 5, 5))).toBe(
      '[JA Korea] 활동인증서_김,서연_260605'
    )
  })
})

describe('buildPortraitConsentDownloadFileName', () => {
  it('[JA Korea] 파일유형명_학생명_YYMMDD 규칙을 따른다', () => {
    const ctx = { student: { id: '1', name: '김/서연', gradeClass: '1-1' }, schoolName: '가나초', educationGrade: '1' }
    expect(
      buildPortraitConsentDownloadFileName(ctx as never, new Date('2026-06-05T12:00:00+09:00'))
    ).toBe('[JA Korea] 초상권 수집·이용 동의서_김,서연_260605')
  })
})
