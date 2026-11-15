/** @vitest-environment jsdom */
import { act, renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const captured: {
  options?: {
    revealPersonalInfo?: (reason: string) => Promise<unknown>
    onPrivacyUnmasked?: (payload: unknown) => void
    onRemask?: () => void
  }
  revealed: boolean
} = { revealed: false }

vi.mock('@/features/user/detail/lib/use-personal-info-reveal', () => ({
  usePersonalInfoReveal: (options: typeof captured.options) => {
    captured.options = options
    return { personalInfoRevealed: captured.revealed }
  },
}))

const unmaskMock = vi.fn()
const fetchInstructorMock = vi.fn(async () => ({ member: { phone: '010-****-0000' } }))
const fetchIndividualMock = vi.fn(async () => ({ member: { phone: '010-****-1111' } }))
const unmaskIndividualMock = vi.fn()
vi.mock('@/features/user/api/members-api-client', () => ({
  fetchInstructorMemberDetailRemote: (...args: unknown[]) => fetchInstructorMock(...(args as [])),
  unmaskInstructorMemberPrivacyRemote: (...args: unknown[]) => unmaskMock(...args),
  fetchIndividualMemberDetailRemote: (...args: unknown[]) => fetchIndividualMock(...(args as [])),
  unmaskIndividualMemberPrivacyRemote: (...args: unknown[]) => unmaskIndividualMock(...args),
}))

vi.mock('./merge-instructor-detail-from-privacy-unmask', () => ({
  mergeInstructorDetailFromPrivacyUnmask: (_detail: unknown, dto: unknown) => ({ source: 'unmask', dto }),
  mergeInstructorDetailFromMaskedMember: () => ({ source: 'masked' }),
  mergeInstructorDetailFromIndividualMember: (_detail: unknown, dto: unknown) => ({
    source: 'individual',
    dto,
  }),
  applyLatestReceiptPayeeAccount: (detail: unknown) => detail,
}))

import {
  resolvePaymentOrderPrivacyMemberSource,
  usePaymentOrderDetailInstructorPrivacyReveal,
} from './use-payment-order-detail-instructor-privacy'

function setup(queryClient: QueryClient) {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  return renderHook(
    () =>
      usePaymentOrderDetailInstructorPrivacyReveal({
        isOpen: true,
        kind: 'instructor',
        instructorRowKey: 1,
        instructorMemberId: 7,
        detail: { nameKo: '가상 강사' } as never,
      }),
    { wrapper }
  )
}

describe('지급 현황 상세 강사 원문 — Query 캐시에 남기지 않는다', () => {
  beforeEach(() => {
    captured.options = undefined
    captured.revealed = false
    unmaskMock.mockReset()
    unmaskMock.mockResolvedValue({ member: { phone: '010-0000-0000' } })
  })

  it('원문은 훅 상태로만 표시하고 다시 가리면 버린다', async () => {
    const queryClient = new QueryClient()
    const { result, rerender } = setup(queryClient)

    let payload: unknown
    await act(async () => {
      payload = await captured.options!.revealPersonalInfo!('가상 사유')
    })
    expect(unmaskMock).toHaveBeenCalledWith(7, { reason: '가상 사유' })

    captured.revealed = true
    act(() => captured.options!.onPrivacyUnmasked!(payload))
    rerender()
    expect(result.current.instructorDetailWithPrivacy).toMatchObject({ source: 'unmask' })

    const cachedRaw = queryClient
      .getQueryCache()
      .findAll()
      .filter(query => !query.queryKey.includes('masked'))
    expect(cachedRaw).toHaveLength(0)

    act(() => captured.options!.onRemask!())
    rerender()
    expect(result.current.instructorDetailWithPrivacy).toMatchObject({ source: 'unmask', dto: undefined })
  })
})

describe('resolvePaymentOrderPrivacyMemberSource — 신청자 유형별 회원 API', () => {
  const detailWith = (payeeTypes: Array<string | undefined>) =>
    ({ nameKo: '가상', programRows: payeeTypes.map(payeeType => ({ payeeType })) }) as never

  it('참여자·봉사자 행만 있으면 개인회원', () => {
    expect(resolvePaymentOrderPrivacyMemberSource(detailWith(['PARTICIPANT']))).toBe('individual')
    expect(resolvePaymentOrderPrivacyMemberSource(detailWith(['VOLUNTEER', 'PARTICIPANT']))).toBe(
      'individual'
    )
  })

  it('강사 행이 하나라도 있거나 라인이 없으면 강사', () => {
    expect(resolvePaymentOrderPrivacyMemberSource(detailWith(['PARTICIPANT', 'INSTRUCTOR']))).toBe(
      'instructor'
    )
    expect(resolvePaymentOrderPrivacyMemberSource(detailWith([]))).toBe('instructor')
    expect(resolvePaymentOrderPrivacyMemberSource(detailWith([undefined]))).toBe('instructor')
  })

  it('상세를 아직 못 받았으면 null(조회하지 않음)', () => {
    expect(resolvePaymentOrderPrivacyMemberSource(null)).toBeNull()
  })
})

describe('참여자 신청자 상세 — 강사 API를 부르지 않는다', () => {
  beforeEach(() => {
    captured.options = undefined
    captured.revealed = false
    fetchInstructorMock.mockClear()
    fetchIndividualMock.mockClear()
    unmaskMock.mockReset()
    unmaskIndividualMock.mockReset()
    unmaskIndividualMock.mockResolvedValue({ member: { phone: '010-0000-1111' } })
  })

  it('마스킹 조회·원문 보기 모두 개인회원 API를 쓴다', async () => {
    const queryClient = new QueryClient()
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(QueryClientProvider, { client: queryClient }, children)
    const { result } = renderHook(
      () =>
        usePaymentOrderDetailInstructorPrivacyReveal({
          isOpen: true,
          kind: 'instructor',
          instructorRowKey: 1,
          instructorMemberId: 9,
          detail: { nameKo: '가상 참여자', programRows: [{ payeeType: 'PARTICIPANT' }] } as never,
        }),
      { wrapper }
    )

    await vi.waitFor(() => expect(fetchIndividualMock).toHaveBeenCalledWith(9))
    expect(fetchInstructorMock).not.toHaveBeenCalled()
    await vi.waitFor(() =>
      expect(result.current.instructorDetailWithPrivacy).toMatchObject({ source: 'individual' })
    )

    await act(async () => {
      await captured.options!.revealPersonalInfo!('가상 사유')
    })
    expect(unmaskIndividualMock).toHaveBeenCalledWith(9, { reason: '가상 사유' })
    expect(unmaskMock).not.toHaveBeenCalled()
  })
})
