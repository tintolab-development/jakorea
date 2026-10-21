import { QueryClient } from '@tanstack/react-query'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cancelOrganizationPortraitConsent,
  fetchOrganizationPortraitConsent,
} from '../src/features/mypage/education/applications/api/student-documents-client'
import {
  applyPortraitConsentCancelError,
  applyPortraitConsentCancelled,
} from '../src/features/mypage/education/applications/api/student-documents-hooks'
import type {
  PortalOrganizationPortraitConsent,
  PortalStudentDocumentPolicy,
} from '../src/features/mypage/education/applications/api/student-documents-types'
import {
  readStudentDocumentsErrorCode,
  resolveStudentDocumentsErrorMessage,
} from '../src/features/mypage/education/applications/lib/student-documents-errors'
import { canCancelOrganizationPortraitConsent } from '../src/features/mypage/education/applications/lib/student-documents-policy'
import { platformQueryKeys } from '../src/shared/api/query-keys'

const { deleteMock, getMock } = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  getMock: vi.fn(),
}))

vi.mock('@/shared/api/axios-instance', () => ({
  axiosClient: {
    delete: deleteMock,
    get: getMock,
    post: vi.fn(),
    put: vi.fn(),
  },
}))

const APPLICATION_ID = '1691428'
const PORTRAIT_CONSENT_URL = `/api/portal/me/organization-applications/${APPLICATION_ID}/portrait-consent`

const SUBMITTED_CONSENT: PortalOrganizationPortraitConsent = {
  artifactId: 31,
  organizationApplicationId: 1691428,
  programId: 100,
  fileObjectId: 556,
  status: 'SUBMITTED',
  revisionNo: 3,
  submittedByMemberId: 12,
  submittedAt: '2026-10-20T09:57:00Z',
  originalFileName: '학생 초상권 동의서.docx',
  fileSize: 332800,
  updatedAt: '2026-10-20T09:57:00Z',
}

const OPEN_POLICY: PortalStudentDocumentPolicy = {
  organizationApplicationId: 1691428,
  programId: 100,
  studentDocumentsSupported: true,
  firstEducationDate: '2026-11-01',
  portraitConsentUploadAllowed: true,
}

function apiError(status: number, code: string, message: string) {
  return {
    isAxiosError: true,
    message: `Request failed with status code ${status}`,
    response: {
      status,
      data: {
        success: false,
        data: null,
        message,
        error: { code, message, field: null, traceId: 'trace-1' },
      },
    },
  }
}

const keys = platformQueryKeys.mypage.organizationApplications

function seededQueryClient(): QueryClient {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(keys.portraitConsent(APPLICATION_ID), SUBMITTED_CONSENT)
  queryClient.setQueryData(keys.studentDocumentsPolicy(APPLICATION_ID), OPEN_POLICY)
  queryClient.setQueryData(keys.studentRoster(APPLICATION_ID), { rows: [] })
  return queryClient
}

function isInvalidated(queryClient: QueryClient, queryKey: readonly unknown[]): boolean {
  return queryClient.getQueryState(queryKey)?.isInvalidated === true
}

describe('cancelOrganizationPortraitConsent', () => {
  beforeEach(() => {
    deleteMock.mockReset()
    getMock.mockReset()
  })

  it('DELETE .../portrait-consent?expectedRevisionNo=GET revisionNo 로 호출하고 204 본문을 읽지 않는다', async () => {
    deleteMock.mockResolvedValue({ status: 204, data: '' })

    await expect(
      cancelOrganizationPortraitConsent(APPLICATION_ID, { expectedRevisionNo: 2 })
    ).resolves.toBeUndefined()

    expect(deleteMock).toHaveBeenCalledTimes(1)
    expect(deleteMock).toHaveBeenCalledWith(PORTRAIT_CONSENT_URL, {
      params: { expectedRevisionNo: 2 },
    })
  })

  it('revisionNo가 없으면 expectedRevisionNo 쿼리를 생략한다', async () => {
    deleteMock.mockResolvedValue({ status: 204, data: '' })
    await cancelOrganizationPortraitConsent(APPLICATION_ID, { expectedRevisionNo: undefined })
    expect(deleteMock).toHaveBeenCalledWith(PORTRAIT_CONSENT_URL, { params: undefined })
  })

  it('오류 응답은 호출자에게 그대로 전달한다', async () => {
    const error = apiError(409, 'PORTRAIT_CONSENT_ALREADY_APPROVED', '승인된 동의서')
    deleteMock.mockRejectedValue(error)
    await expect(
      cancelOrganizationPortraitConsent(APPLICATION_ID, { expectedRevisionNo: 3 })
    ).rejects.toBe(error)
  })
})

describe('fetchOrganizationPortraitConsent', () => {
  beforeEach(() => getMock.mockReset())

  it.each([
    ['빈 문자열', ''],
    ['null', null],
    ['undefined', undefined],
    ['빈 객체', {}],
  ])('200 %s 본문은 미제출(null)로 정규화한다', async (_label, data) => {
    getMock.mockResolvedValue({ status: 200, data })
    await expect(fetchOrganizationPortraitConsent(APPLICATION_ID)).resolves.toBeNull()
  })

  it('제출 응답은 원본 객체 그대로 반환한다', async () => {
    getMock.mockResolvedValue({ status: 200, data: SUBMITTED_CONSENT })
    await expect(fetchOrganizationPortraitConsent(APPLICATION_ID)).resolves.toEqual(
      SUBMITTED_CONSENT
    )
  })
})

describe('canCancelOrganizationPortraitConsent', () => {
  it('제출 있음 + 기한 내 + SUBMITTED/REJECTED 이면 취소할 수 있다', () => {
    expect(canCancelOrganizationPortraitConsent(SUBMITTED_CONSENT, OPEN_POLICY)).toBe(true)
    expect(
      canCancelOrganizationPortraitConsent({ ...SUBMITTED_CONSENT, status: 'REJECTED' }, OPEN_POLICY)
    ).toBe(true)
  })

  it('APPROVED 이면 취소할 수 없다', () => {
    expect(
      canCancelOrganizationPortraitConsent({ ...SUBMITTED_CONSENT, status: 'APPROVED' }, OPEN_POLICY)
    ).toBe(false)
  })

  it('기한 경과(portraitConsentUploadAllowed=false)이거나 policy가 없으면 취소할 수 없다', () => {
    expect(
      canCancelOrganizationPortraitConsent(SUBMITTED_CONSENT, {
        ...OPEN_POLICY,
        portraitConsentUploadAllowed: false,
      })
    ).toBe(false)
    expect(canCancelOrganizationPortraitConsent(SUBMITTED_CONSENT, undefined)).toBe(false)
  })

  it('제출이 없으면 취소할 수 없다', () => {
    expect(canCancelOrganizationPortraitConsent(null, OPEN_POLICY)).toBe(false)
  })
})

describe('portrait consent cancel error messages', () => {
  it('서버 message가 있으면 우선 표시한다', () => {
    const error = apiError(409, 'PORTRAIT_CONSENT_REVISION_CONFLICT', '서버 안내 문구')
    expect(readStudentDocumentsErrorCode(error)).toBe('PORTRAIT_CONSENT_REVISION_CONFLICT')
    expect(resolveStudentDocumentsErrorMessage(error)).toBe('서버 안내 문구')
  })

  it.each([
    ['PERMISSION_DENIED', '해당 기관 신청에 접근할 권한이 없습니다.'],
    ['PORTRAIT_CONSENT_NOT_FOUND', '취소할 초상권 동의서가 없습니다.'],
    [
      'PORTRAIT_CONSENT_REVISION_CONFLICT',
      '초상권 동의서가 다른 화면에서 변경되었습니다. 최신 상태를 다시 확인해 주세요.',
    ],
    [
      'PORTRAIT_CONSENT_ALREADY_APPROVED',
      '승인된 초상권 동의서는 업로드를 취소할 수 없습니다. 변경이 필요하면 담당자에게 문의해 주세요.',
    ],
    ['PORTRAIT_CONSENT_DEADLINE_PASSED', '초상권 동의서 제출 및 수정 기한이 지났습니다.'],
    ['AUDIT_LOG_UNAVAILABLE', '일시적인 오류로 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.'],
  ])('message가 없으면 %s 매핑 문구를 표시한다', (code, expected) => {
    const error = apiError(409, code, '')
    expect(resolveStudentDocumentsErrorMessage(error)).toBe(expected)
  })
})

describe('portrait consent cancel cache handling', () => {
  const input = { applicationId: APPLICATION_ID, programId: 100 }

  it('취소 성공 시 동의서를 null로 바꾸고 policy·roster를 다시 조회하게 한다', async () => {
    const queryClient = seededQueryClient()

    await applyPortraitConsentCancelled(queryClient, input)

    expect(queryClient.getQueryData(keys.portraitConsent(APPLICATION_ID))).toBeNull()
    expect(isInvalidated(queryClient, keys.studentDocumentsPolicy(APPLICATION_ID))).toBe(true)
    expect(isInvalidated(queryClient, keys.studentRoster(APPLICATION_ID))).toBe(true)
  })

  it('404 PORTRAIT_CONSENT_NOT_FOUND 는 빈 상태로 맞춘다', async () => {
    const queryClient = seededQueryClient()

    await applyPortraitConsentCancelError(
      queryClient,
      apiError(404, 'PORTRAIT_CONSENT_NOT_FOUND', '취소할 초상권 동의서가 없습니다.'),
      input
    )

    expect(queryClient.getQueryData(keys.portraitConsent(APPLICATION_ID))).toBeNull()
    expect(isInvalidated(queryClient, keys.studentRoster(APPLICATION_ID))).toBe(true)
  })

  it('409 REVISION_CONFLICT 는 제출을 유지한 채 동의서를 다시 조회하게 한다', async () => {
    const queryClient = seededQueryClient()

    await applyPortraitConsentCancelError(
      queryClient,
      apiError(409, 'PORTRAIT_CONSENT_REVISION_CONFLICT', '충돌'),
      input
    )

    expect(queryClient.getQueryData(keys.portraitConsent(APPLICATION_ID))).toEqual(
      SUBMITTED_CONSENT
    )
    expect(isInvalidated(queryClient, keys.portraitConsent(APPLICATION_ID))).toBe(true)
    expect(isInvalidated(queryClient, keys.studentDocumentsPolicy(APPLICATION_ID))).toBe(false)
  })

  it.each(['PORTRAIT_CONSENT_DEADLINE_PASSED', 'PORTRAIT_CONSENT_ALREADY_APPROVED'])(
    '409 %s 는 policy와 동의서를 다시 조회하게 한다',
    async code => {
      const queryClient = seededQueryClient()

      await applyPortraitConsentCancelError(queryClient, apiError(409, code, '안내'), input)

      expect(queryClient.getQueryData(keys.portraitConsent(APPLICATION_ID))).toEqual(
        SUBMITTED_CONSENT
      )
      expect(isInvalidated(queryClient, keys.portraitConsent(APPLICATION_ID))).toBe(true)
      expect(isInvalidated(queryClient, keys.studentDocumentsPolicy(APPLICATION_ID))).toBe(true)
    }
  )

  it.each([
    [403, 'PERMISSION_DENIED'],
    [503, 'AUDIT_LOG_UNAVAILABLE'],
  ])('%i %s 는 제출 상태를 바꾸지 않는다', async (status, code) => {
    const queryClient = seededQueryClient()

    await applyPortraitConsentCancelError(queryClient, apiError(status, code, '안내'), input)

    expect(queryClient.getQueryData(keys.portraitConsent(APPLICATION_ID))).toEqual(
      SUBMITTED_CONSENT
    )
    expect(isInvalidated(queryClient, keys.portraitConsent(APPLICATION_ID))).toBe(false)
  })
})
