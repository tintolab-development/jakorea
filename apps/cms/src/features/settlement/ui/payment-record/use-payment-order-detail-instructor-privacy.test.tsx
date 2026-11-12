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
vi.mock('@/features/user/api/members-api-client', () => ({
  fetchInstructorMemberDetailRemote: vi.fn(async () => ({ member: { phone: '010-****-0000' } })),
  unmaskInstructorMemberPrivacyRemote: (...args: unknown[]) => unmaskMock(...args),
}))

vi.mock('./merge-instructor-detail-from-privacy-unmask', () => ({
  mergeInstructorDetailFromPrivacyUnmask: (_detail: unknown, dto: unknown) => ({ source: 'unmask', dto }),
  mergeInstructorDetailFromMaskedMember: () => ({ source: 'masked' }),
}))

import { usePaymentOrderDetailInstructorPrivacyReveal } from './use-payment-order-detail-instructor-privacy'

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
