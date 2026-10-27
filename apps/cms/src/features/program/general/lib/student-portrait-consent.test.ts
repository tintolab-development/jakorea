import { describe, expect, it } from 'vitest'
import { resolveOrganizationPortraitConsentDownload } from './student-portrait-consent'

describe('resolveOrganizationPortraitConsentDownload', () => {
  it('기관 GET 파일 1건만 다운로드 대상으로 쓴다', () => {
    expect(
      resolveOrganizationPortraitConsentDownload({
        fileObjectId: 88001,
        originalFileName: '학교전체_초상권.pdf',
      })
    ).toEqual({
      fileObjectId: 88001,
      fileName: '학교전체_초상권.pdf',
    })
  })

  it('파일 없거나 0이면 미제출이다', () => {
    expect(resolveOrganizationPortraitConsentDownload(null)).toBeNull()
    expect(resolveOrganizationPortraitConsentDownload({})).toBeNull()
    expect(resolveOrganizationPortraitConsentDownload({ fileObjectId: 0 })).toBeNull()
  })

  it('원본 파일명이 없으면 기본 파일명을 쓴다', () => {
    expect(resolveOrganizationPortraitConsentDownload({ fileObjectId: 12 })).toEqual({
      fileObjectId: 12,
      fileName: '초상권동의서',
    })
  })

  it('문자열 fileObjectId도 다운로드 대상으로 받는다', () => {
    expect(
      resolveOrganizationPortraitConsentDownload({
        fileObjectId: '88001' as unknown as number,
        originalFileName: '초상권.docx',
      })
    ).toEqual({
      fileObjectId: 88001,
      fileName: '초상권.docx',
    })
  })
})
