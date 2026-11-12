/**
 * 지급 현황 상세(강사) — instructor member privacy/unmask
 *
 * 원문(unmask) 응답은 Query 캐시에 두지 않고 이 훅의 상태에만 둔다. 다시 가리기·닫기·대상 전환
 * (usePersonalInfoReveal onRemask)에서 바로 버린다 — 다시 열람하면 사유 입력과 조회 이력을 새로 남긴다.
 */

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminProgramDetail,
} from '@/features/settlement-management/model/payment-order-admin-list'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import {
  fetchInstructorMemberDetailRemote,
  unmaskInstructorMemberPrivacyRemote,
} from '@/features/user/api/members-api-client'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas/instructorMemberDetailResponse'
import {
  mergeInstructorDetailFromMaskedMember,
  mergeInstructorDetailFromPrivacyUnmask,
} from './merge-instructor-detail-from-privacy-unmask'

type DetailForPrivacy = PaymentOrderAdminProgramDetail | PaymentOrderAdminInstructorDetail

export function usePaymentOrderDetailInstructorPrivacyReveal(options: {
  isOpen: boolean
  kind: 'program' | 'instructor'
  instructorRowKey: number | null
  instructorMemberId?: number | null
  detail: DetailForPrivacy | null
}) {
  const { isOpen, kind, instructorRowKey, instructorMemberId, detail } = options
  const memberId =
    kind === 'instructor' &&
    instructorMemberId != null &&
    Number.isFinite(instructorMemberId) &&
    instructorMemberId > 0
      ? instructorMemberId
      : null

  /** 원문 응답과 요청 당시 회원 ID. 다른 회원으로 바뀌면 쓰지 않는다. */
  const [revealedPrivacy, setRevealedPrivacy] = useState<{
    memberId: number
    dto: InstructorMemberDetailResponse
  } | null>(null)

  const maskedQueryKey = useMemo(
    () =>
      memberId != null
        ? ([...settlementQueryKeys.paymentOrders.instructorPrivacyUnmask(memberId), 'masked'] as const)
        : (['cms', 'settlement', 'paymentOrders', 'instructorPrivacyMasked', 'none'] as const),
    [memberId]
  )

  const resolvePersonalInfoAccessItem = useCallback(() => {
    if (detail && 'nameKo' in detail) {
      return detail.nameKo ?? '지급 현황 상세 강사'
    }
    return '지급 현황 상세 강사'
  }, [detail])

  const revealPersonalInfo = useCallback(
    async (reason: string) => {
      if (memberId == null) {
        throw new Error(
          '강사 회원 ID(instructorMemberId)가 없어 개인정보 원문을 조회할 수 없습니다.'
        )
      }
      const dto = await unmaskInstructorMemberPrivacyRemote(memberId, { reason })
      return { memberId, dto }
    },
    [memberId]
  )

  const handlePrivacyUnmasked = useCallback((payload: unknown) => {
    const next = payload as { memberId: number; dto: InstructorMemberDetailResponse } | undefined
    if (next?.dto) setRevealedPrivacy(next)
  }, [])

  const clearRevealedPrivacy = useCallback(() => setRevealedPrivacy(null), [])

  const reveal = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    revealPersonalInfo: kind === 'instructor' ? revealPersonalInfo : undefined,
    onPrivacyUnmasked: handlePrivacyUnmasked,
    onRemask: clearRevealedPrivacy,
    resetDeps: [isOpen, kind, instructorRowKey, memberId],
    controlMode: 'toggleRemask',
  })

  const { data: maskedDto } = useQuery({
    queryKey: maskedQueryKey,
    enabled: kind === 'instructor' && memberId != null && isOpen && !reveal.personalInfoRevealed,
    staleTime: 60_000,
    queryFn: async (): Promise<InstructorMemberDetailResponse> => {
      if (memberId == null) {
        throw new Error('강사 회원 ID가 없습니다.')
      }
      return fetchInstructorMemberDetailRemote(memberId)
    },
    retry: false,
  })

  const unmaskDto =
    reveal.personalInfoRevealed && revealedPrivacy != null && revealedPrivacy.memberId === memberId
      ? revealedPrivacy.dto
      : undefined

  let instructorDetailWithPrivacy: PaymentOrderAdminInstructorDetail | null = null
  if (kind === 'instructor' && detail && 'nameKo' in detail) {
    instructorDetailWithPrivacy = reveal.personalInfoRevealed
      ? mergeInstructorDetailFromPrivacyUnmask(detail, unmaskDto)
      : mergeInstructorDetailFromMaskedMember(detail, maskedDto)
  }

  return {
    ...reveal,
    instructorDetailWithPrivacy,
    hasInstructorMemberId: memberId != null,
  }
}
