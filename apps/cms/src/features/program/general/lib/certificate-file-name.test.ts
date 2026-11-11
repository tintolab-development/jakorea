import { describe, expect, it } from 'vitest'
import { buildActivityCertificateFileName } from './build-activity-certificate-issuance-preview'
import { buildPortraitConsentDownloadFileName } from './build-portrait-consent-download'
import { buildStudentCertificateFileName } from './build-student-certificate-issuance'
import { parseCertificateIssuedAt } from '@/features/program/shared/lib/apply-allocated-serial-for-pdf-capture'
import { formatAsiaSeoulYymmdd } from '@/features/settlement-management/api/account-payments/settlement-form-download'
import {
  certificateIssueDateIso,
  formatCertificateIssueDate,
} from '@/pages/templates/form-certificate-preview-utils'

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

  it('발급일(issuedAt)은 Asia/Seoul 날짜로 쓴다', () => {
    expect(buildActivityCertificateFileName('김서연', new Date('2026-11-09T16:30:00Z'))).toBe(
      '[JA Korea] 활동인증서_김서연_261110'
    )
  })

  it('발급일이 없으면 오늘 날짜를 쓴다', () => {
    expect(buildActivityCertificateFileName('김서연', null)).toBe(
      `[JA Korea] 활동인증서_김서연_${formatAsiaSeoulYymmdd(new Date())}`
    )
  })
})

describe('buildStudentCertificateFileName', () => {
  const ctx = { student: { id: '1', name: '한서윤' }, certificateKind: 'COMPLETION' }

  it('발급일(issuedAt)을 Asia/Seoul 날짜로 쓴다', () => {
    expect(
      buildStudentCertificateFileName(ctx as never, new Date('2026-11-09T16:30:00Z'))
    ).toMatch(/^\[JA Korea\] .+_한서윤_261110$/)
  })

  it('발급일이 없으면 오늘 날짜를 쓴다', () => {
    expect(buildStudentCertificateFileName(ctx as never)).toMatch(
      new RegExp(`_한서윤_${formatAsiaSeoulYymmdd(new Date())}$`)
    )
  })
})

describe('parseCertificateIssuedAt', () => {
  it('ISO 문자열은 Date, 그 외는 null', () => {
    expect(parseCertificateIssuedAt('2026-11-10T01:00:00Z')?.toISOString()).toBe(
      '2026-11-10T01:00:00.000Z'
    )
    expect(parseCertificateIssuedAt(null)).toBeNull()
    expect(parseCertificateIssuedAt('')).toBeNull()
    expect(parseCertificateIssuedAt('not-a-date')).toBeNull()
  })
})

describe('증명서 본문 발급일 표기', () => {
  it('Asia/Seoul 날짜로 표기해 파일명 날짜와 같다', () => {
    const issuedAt = new Date('2026-11-09T16:30:00Z')
    expect(formatCertificateIssueDate(issuedAt)).toBe('2026년 11월 10일')
    expect(certificateIssueDateIso(issuedAt)).toBe('2026-11-10')
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
