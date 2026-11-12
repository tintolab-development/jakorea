import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CLIENT_DOWNLOAD_KIND_LABEL,
  FILE_ACCESS_CLIENT_LOG_META_ENV,
  buildFileAccessLogMetaBody,
  isFileAccessClientLogMetaEnabled,
  resolveDownloadAccessLogMeta,
} from './download-access-log-meta'

describe('download-access-log-meta', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('플래그가 꺼져 있으면 body에 아무것도 붙이지 않는다', () => {
    vi.stubEnv(FILE_ACCESS_CLIENT_LOG_META_ENV, '')
    expect(isFileAccessClientLogMetaEnabled()).toBe(false)
    expect(
      buildFileAccessLogMetaBody({ downloadKind: 'MEMBER_LIST_EXPORT', containedPiiTypes: ['NAME'] })
    ).toEqual({})
  })

  it('플래그가 켜지면 downloadKind·containedPiiTypes를 붙인다', () => {
    vi.stubEnv(FILE_ACCESS_CLIENT_LOG_META_ENV, ' TRUE ')
    expect(
      buildFileAccessLogMetaBody({ downloadKind: 'MEMBER_LIST_EXPORT', containedPiiTypes: ['NAME'] })
    ).toEqual({ downloadKind: 'MEMBER_LIST_EXPORT', containedPiiTypes: ['NAME'] })
  })

  it('PII는 서버 허용 순서로 중복 없이 보내고, 비어 있으면 필드를 생략한다', () => {
    vi.stubEnv(FILE_ACCESS_CLIENT_LOG_META_ENV, 'true')
    expect(
      buildFileAccessLogMetaBody({
        downloadKind: 'SETTLEMENT_EXPORT',
        containedPiiTypes: ['ACCOUNT_NUMBER', 'NAME', 'ACCOUNT_NUMBER'],
      })
    ).toEqual({ downloadKind: 'SETTLEMENT_EXPORT', containedPiiTypes: ['NAME', 'ACCOUNT_NUMBER'] })
    expect(
      buildFileAccessLogMetaBody({ downloadKind: 'PROGRAM_LIST_EXPORT', containedPiiTypes: [] })
    ).toEqual({ downloadKind: 'PROGRAM_LIST_EXPORT' })
    expect(buildFileAccessLogMetaBody(undefined)).toEqual({})
  })

  it('K(2026-11-12): 9종 유형을 서버 허용 순서로 최대 9개까지 보낸다', () => {
    vi.stubEnv(FILE_ACCESS_CLIENT_LOG_META_ENV, 'true')
    expect(
      buildFileAccessLogMetaBody({
        downloadKind: 'PROGRAM_STUDENT_LIST_EXPORT',
        containedPiiTypes: ['EMAIL', 'PHONE', 'BIRTH_DATE', 'GENDER', 'NAME'],
      })
    ).toEqual({
      downloadKind: 'PROGRAM_STUDENT_LIST_EXPORT',
      containedPiiTypes: ['NAME', 'BIRTH_DATE', 'GENDER', 'PHONE', 'EMAIL'],
    })
    expect(
      buildFileAccessLogMetaBody({
        downloadKind: 'VOLUNTEER_1365_HOURS_EXPORT',
        containedPiiTypes: [
          'EXTERNAL_1365_ID', 'HOME_ADDRESS', 'EMAIL', 'PHONE', 'GENDER',
          'BIRTH_DATE', 'ACCOUNT_NUMBER', 'RESIDENT_REGISTRATION_NUMBER', 'NAME',
        ],
      }).containedPiiTypes
    ).toHaveLength(9)
  })

  it('함수 입력은 다운로드 시점에 계산한다', () => {
    let mode: 'applicant' | 'program' = 'program'
    const input = () => ({
      downloadKind: 'PAYMENT_ORDER_LIST_EXPORT' as const,
      containedPiiTypes: mode === 'applicant' ? (['NAME'] as const) : ([] as const),
    })
    expect(resolveDownloadAccessLogMeta(input)?.containedPiiTypes).toEqual([])
    mode = 'applicant'
    expect(resolveDownloadAccessLogMeta(input)?.containedPiiTypes).toEqual(['NAME'])
  })

  it('모든 downloadKind가 서버 형식(^[A-Z][A-Z0-9_]*$, 80자 이하)을 지키고 라벨이 있다', () => {
    for (const [kind, label] of Object.entries(CLIENT_DOWNLOAD_KIND_LABEL)) {
      expect(kind).toMatch(/^[A-Z][A-Z0-9_]*$/)
      expect(kind.length).toBeLessThanOrEqual(80)
      expect(label.trim()).not.toBe('')
    }
  })
})
