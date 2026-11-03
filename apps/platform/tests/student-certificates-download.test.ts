import { beforeEach, describe, expect, it, vi } from 'vitest'
import { downloadOrganizationStudentCertificates } from '../src/features/mypage/education/applications/api/student-documents-client'
import type { PortalStudentRosterResponse } from '../src/features/mypage/education/applications/api/student-documents-types'
import {
  CertificateBulkDownloadError,
  certificateRowsForApplication,
  currentCertificateSelectionKeys,
  parseCertificateBulkDownloadErrorBody,
  resolveSelectedRosterIds,
  toCertificateRosterEntries,
} from '../src/features/mypage/education/applications/lib/certificate-bulk-download'

const { postMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
}))

vi.mock('@/shared/api/axios-instance', () => ({
  axiosClient: {
    post: postMock,
  },
}))

const APPLICATION_ID = '1691428'
const OTHER_APPLICATION_ID = '1691429'
const BULK_DOWNLOAD_URL = `/api/portal/me/organization-applications/${APPLICATION_ID}/certificates/bulk-download`

/** GET .../student-roster 응답 (OpenAPI `StudentRosterResponse`) */
const ROSTER_FIXTURE: PortalStudentRosterResponse = {
  organizationApplicationId: 1691428,
  programId: 1690001,
  importBatchId: null,
  importStatus: 'COMMITTED',
  revisionNo: 3,
  totalCount: 3,
  committedAt: '2026-10-15T10:00:00',
  rows: [
    {
      rosterId: 1691594,
      memberId: 501,
      participantId: 880001,
      studentName: '김학생',
      gender: 'MALE',
      birthDate: '2012-03-01',
      grade: '5',
      className: '1',
      studentNo: 1,
      maskedPhone: '010-****-1234',
      maskedEmail: 'k***@example.com',
      revisionNo: 3,
    },
    {
      rosterId: 1691595,
      memberId: 502,
      participantId: 880002,
      studentName: '이학생',
      gender: 'FEMALE',
      birthDate: '2012-05-10',
      grade: '5',
      className: '1',
      studentNo: 2,
      maskedPhone: '010-****-5678',
      maskedEmail: 'l***@example.com',
      revisionNo: 3,
    },
    {
      memberId: 503,
      participantId: 880003,
      studentName: '명단미확정',
      gender: 'MALE',
      birthDate: '2012-07-20',
      className: '2',
    },
  ],
}

const anchor = {
  href: '',
  download: '',
  click: vi.fn(),
  remove: vi.fn(),
}

function zipResponse(blob = new Blob(['PK\u0003\u0004zip-bytes'], { type: 'application/zip' })) {
  return {
    status: 200,
    data: blob,
    headers: {
      'content-type': 'application/zip',
      'content-disposition': 'attachment; filename="student-certificates.zip"',
      'cache-control': 'no-store',
    },
  }
}

function blobError(status: number, body: unknown, headers: Record<string, string> = {}) {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  return {
    isAxiosError: true,
    message: `Request failed with status code ${status}`,
    response: {
      status,
      data: new Blob([text], { type: 'application/zip' }),
      headers,
    },
  }
}

function apiErrorBody(code: string, message: string, traceId: string | null = null) {
  return { success: false, data: null, message, error: { code, message, traceId } }
}

function fixtureRosterIds(): number[] {
  const rows = certificateRowsForApplication(ROSTER_FIXTURE, APPLICATION_ID)
  const entries = toCertificateRosterEntries(rows)
  const allSelectable = new Set(entries.flatMap(entry => (entry.selectionKey ? [entry.selectionKey] : [])))
  return resolveSelectedRosterIds(entries, allSelectable)
}

describe('organization student certificate bulk download', () => {
  beforeEach(() => {
    postMock.mockReset()
    postMock.mockResolvedValue(zipResponse())
    anchor.href = ''
    anchor.download = ''
    anchor.click.mockReset()
    anchor.remove.mockReset()

    vi.stubGlobal('document', {
      createElement: vi.fn(() => anchor),
      body: { appendChild: vi.fn() },
    })
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:certificate'),
      revokeObjectURL: vi.fn(),
    })
    vi.stubGlobal('window', {
      setTimeout: (callback: () => void) => {
        callback()
        return 0
      },
    })
  })

  it('현재 applicationId와 fixture rosterId로 정확한 POST URL·body·responseType을 보낸다', async () => {
    const rosterIds = fixtureRosterIds()
    expect(rosterIds).toEqual([1691594, 1691595])

    await downloadOrganizationStudentCertificates(APPLICATION_ID, rosterIds)

    expect(postMock).toHaveBeenCalledTimes(1)
    expect(postMock).toHaveBeenCalledWith(
      BULK_DOWNLOAD_URL,
      { rosterIds: [1691594, 1691595], certificateType: 'COMPLETION' },
      {
        responseType: 'blob',
        headers: { Accept: 'application/zip, application/json' },
        transformResponse: expect.any(Array),
      }
    )
  })

  it('certificateType은 항상 COMPLETION이다', async () => {
    await downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594])
    const body = postMock.mock.calls[0][1]
    expect(body.certificateType).toBe('COMPLETION')
    expect(Object.keys(body).sort()).toEqual(['certificateType', 'rosterIds'])
  })

  it('200 ZIP Blob을 수료증_이름_YYMMDD.zip으로 저장한다', async () => {
    const zip = new Blob(['PK\u0003\u0004zip-bytes'], { type: 'application/zip' })
    postMock.mockResolvedValue(zipResponse(zip))

    await downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594, 1691595], {
      fileName: '수료증_강하은_261103.zip',
    })

    expect(URL.createObjectURL).toHaveBeenCalledWith(zip)
    expect(anchor.download).toBe('수료증_강하은_261103.zip')
    expect(anchor.click).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:certificate')
  })

  it('200이어도 크기 0 Blob이면 실패 처리하고 저장하지 않는다', async () => {
    postMock.mockResolvedValue(zipResponse(new Blob([], { type: 'application/zip' })))

    await expect(
      downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594])
    ).rejects.toBeInstanceOf(CertificateBulkDownloadError)
    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('200 JSON(signed URL 등) 응답은 성공으로 간주하지 않는다', async () => {
    postMock.mockResolvedValue({
      status: 200,
      data: new Blob([JSON.stringify({ success: true, data: { downloadUrl: 'https://s3/x.zip' } })], {
        type: 'application/json',
      }),
      headers: { 'content-type': 'application/json' },
    })

    await expect(
      downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594])
    ).rejects.toBeInstanceOf(CertificateBulkDownloadError)
    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('빈 선택이면 API를 호출하지 않는다', async () => {
    await expect(downloadOrganizationStudentCertificates(APPLICATION_ID, [])).rejects.toThrow(
      '수료증을 발급할 학생을 선택해 주세요.'
    )
    expect(postMock).not.toHaveBeenCalled()
  })

  it('101명 선택은 API 호출 전에 차단한다', async () => {
    const rosterIds = Array.from({ length: 101 }, (_, index) => 1691594 + index)
    await expect(downloadOrganizationStudentCertificates(APPLICATION_ID, rosterIds)).rejects.toThrow(
      '수료증은 한 번에 100명까지 다운로드할 수 있습니다.'
    )
    expect(postMock).not.toHaveBeenCalled()
  })

  it('100명은 허용한다', async () => {
    const rosterIds = Array.from({ length: 100 }, (_, index) => 1691594 + index)
    await downloadOrganizationStudentCertificates(APPLICATION_ID, rosterIds)
    expect(postMock).toHaveBeenCalledTimes(1)
  })

  it('중복 rosterId는 API 호출 전에 차단한다', async () => {
    await expect(
      downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594, 1691594])
    ).rejects.toThrow('중복으로 선택된 학생이 있습니다.')
    expect(postMock).not.toHaveBeenCalled()
  })

  it.each([
    [400, 'PORTAL_CERTIFICATE_BULK_REQUEST_INVALID'],
    [400, 'PORTAL_CERTIFICATE_ROSTER_IDS_INVALID'],
    [403, 'PERMISSION_DENIED'],
    [404, 'PORTAL_STUDENT_ROSTER_NOT_FOUND'],
    [404, 'ORGANIZATION_APPLICATION_NOT_FOUND'],
    [409, 'PORTAL_CERTIFICATE_ISSUANCE_NOT_READY'],
    [409, 'CERTIFICATE_ISSUE_REQUIRED'],
    [409, 'CERTIFICATE_RENDER_HISTORICAL_DATA_INCOMPLETE'],
    [503, 'CERTIFICATE_OFFICIAL_TEMPLATE_UNAVAILABLE'],
  ])('%i %s 오류 Blob을 JSON으로 파싱해 서버 message와 추적 ID를 안내한다', async (status, code) => {
    postMock.mockRejectedValue(blobError(status, apiErrorBody(code, 'server message', 'trace-1')))

    const error = await downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594]).catch(
      (caught: unknown) => caught
    )

    expect(error).toBeInstanceOf(CertificateBulkDownloadError)
    expect((error as CertificateBulkDownloadError).message).toBe(
      'server message (오류 추적 ID: trace-1)'
    )
    expect((error as CertificateBulkDownloadError).status).toBe(status)
    expect((error as CertificateBulkDownloadError).code).toBe(code)
    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('서버 message가 없으면 error.code 안내와 추적 ID를 표시한다', async () => {
    postMock.mockRejectedValue(
      blobError(409, {
        success: false,
        data: null,
        message: '',
        error: { code: 'PORTAL_CERTIFICATE_ISSUANCE_NOT_READY', message: '', traceId: 'trace-409' },
      })
    )

    await expect(downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594])).rejects.toThrow(
      '수료 조건을 충족하지 않은 학생이 포함되어 있습니다. (오류 추적 ID: trace-409)'
    )
    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('409여도 발급 API를 호출하지 않는다', async () => {
    postMock.mockRejectedValue(
      blobError(409, apiErrorBody('CERTIFICATE_ISSUE_REQUIRED', '발급 이력이 없습니다.', 'trace-issue'))
    )

    await expect(downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594])).rejects.toBeInstanceOf(
      CertificateBulkDownloadError
    )
    expect(postMock).toHaveBeenCalledTimes(1)
    expect(postMock.mock.calls[0][0]).toBe(BULK_DOWNLOAD_URL)
    expect(String(postMock.mock.calls[0][0])).not.toMatch(/issue/)
  })

  it('401은 서버 message와 추적 ID를 덮지 않는다', async () => {
    postMock.mockRejectedValue(
      blobError(401, apiErrorBody('UNAUTHORIZED', '인증이 필요합니다.', 'trace-401'))
    )

    await expect(downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594])).rejects.toThrow(
      '인증이 필요합니다. (오류 추적 ID: trace-401)'
    )
    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('traceId가 없으면 응답 헤더 requestId를 함께 표시한다', async () => {
    postMock.mockRejectedValue(
      blobError(500, apiErrorBody('INTERNAL_SERVER_ERROR', 'error', null), {
        'X-Request-Id': 'req-500',
      })
    )

    await expect(downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594])).rejects.toThrow(
      'error (오류 추적 ID: req-500)'
    )
  })

  it('JSON이 아닌 오류 Blob은 일반 다운로드 오류로 안내하고 ZIP으로 저장하지 않는다', async () => {
    postMock.mockRejectedValue(blobError(502, '<html>Bad Gateway</html>'))

    await expect(downloadOrganizationStudentCertificates(APPLICATION_ID, [1691594])).rejects.toThrow(
      '수료증을 다운로드하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    )
    expect(anchor.click).not.toHaveBeenCalled()
  })

  it('다른 기관 신청의 rosterId를 주입하면 서버 404를 정상 안내 문구로 표시한다', async () => {
    postMock.mockRejectedValue(
      blobError(404, apiErrorBody('PORTAL_STUDENT_ROSTER_NOT_FOUND', 'not found'))
    )

    await expect(downloadOrganizationStudentCertificates(APPLICATION_ID, [9999999])).rejects.toThrow(
      'not found'
    )
    expect(postMock.mock.calls[0][0]).toBe(BULK_DOWNLOAD_URL)
  })

  it('오류 Blob 파서는 error.code·message·traceId를 추출한다', async () => {
    const parsed = await parseCertificateBulkDownloadErrorBody(
      new Blob([JSON.stringify(apiErrorBody('CERTIFICATE_ISSUE_REQUIRED', '발급 필요', 'trace-9'))])
    )
    expect(parsed).toEqual({
      code: 'CERTIFICATE_ISSUE_REQUIRED',
      message: '발급 필요',
      traceId: 'trace-9',
    })
    await expect(parseCertificateBulkDownloadErrorBody(new Blob(['not-json']))).resolves.toBeNull()
  })
})

describe('certificate roster selection', () => {
  it('participantId·memberId가 아니라 rosterId만 요청값으로 사용한다', () => {
    const entries = toCertificateRosterEntries(ROSTER_FIXTURE.rows ?? [])
    const rosterIds = resolveSelectedRosterIds(
      entries,
      new Set(['roster-1691594', 'roster-1691595'])
    )
    expect(rosterIds).toEqual([1691594, 1691595])
    expect(rosterIds).not.toContain(880001)
    expect(rosterIds).not.toContain(501)
  })

  it('rosterId가 없는 행은 선택 대상에서 제외한다', () => {
    const entries = toCertificateRosterEntries(ROSTER_FIXTURE.rows ?? [])
    expect(entries.map(entry => entry.selectionKey)).toEqual([
      'roster-1691594',
      'roster-1691595',
      null,
    ])
  })

  it('선택 해제한 rosterId는 요청에 남지 않고, 선택 수와 요청 수가 같다', () => {
    const entries = toCertificateRosterEntries(ROSTER_FIXTURE.rows ?? [])
    const selected = new Set(['roster-1691594', 'roster-1691595'])
    selected.delete('roster-1691594')
    const rosterIds = resolveSelectedRosterIds(entries, selected)
    expect(rosterIds).toEqual([1691595])
    expect(rosterIds).toHaveLength(selected.size)
  })

  it('applicationId가 바뀌면 이전 신청의 선택을 재사용하지 않는다', () => {
    const selection = { applicationId: APPLICATION_ID, keys: new Set(['roster-1691594']) }
    expect(currentCertificateSelectionKeys(selection, APPLICATION_ID).has('roster-1691594')).toBe(true)
    expect(currentCertificateSelectionKeys(selection, OTHER_APPLICATION_ID).size).toBe(0)
  })

  it('다른 기관 신청의 roster 응답은 선택 목록에 노출하지 않는다', () => {
    expect(certificateRowsForApplication(ROSTER_FIXTURE, APPLICATION_ID)).toHaveLength(3)
    expect(certificateRowsForApplication(ROSTER_FIXTURE, OTHER_APPLICATION_ID)).toEqual([])
    expect(certificateRowsForApplication(undefined, APPLICATION_ID)).toEqual([])
  })
})
