/**
 * 지급 현황 상세(강사) — instructor member privacy/unmask + 캐시 SSOT
 */

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  PaymentOrderAdminInstructorDetail,
  PaymentOrderAdminProgramDetail,
} from '@/features/settlement-management/model/payment-order-admin-list'
import { settlementQueryKeys } from '@/features/settlement-management/api/settlement-query-keys'
import { unmaskInstructorMemberPrivacyRemote } from '@/features/user/api/members-api-client'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas/instructorMemberDetailResponse'
import { mergeInstructorDetailFromPrivacyUnmask } from './merge-instructor-detail-from-privacy-unmask'

type DetailForPrivacy = PaymentOrderAdminProgramDetail | PaymentOrderAdminInstructorDetail

export function usePaymentOrderDetailInstructorPrivacyReveal(options: {
  isOpen: boolean
  kind: 'program' | 'instructor'
  instructorRowKey: number | null
  instructorMemberId?: number | null
  detail: DetailForPrivacy | null
}) {
  const { isOpen, kind, instructorRowKey, instructorMemberId, detail } = options
  const queryClient = useQueryClient()
  const memberId =
    kind === 'instructor' &&
    instructorMemberId != null &&
    Number.isFinite(instructorMemberId) &&
    instructorMemberId > 0
      ? instructorMemberId
      : null

  const privacyQueryKey =
    memberId != null
      ? settlementQueryKeys.paymentOrders.instructorPrivacyUnmask(memberId)
      : (['cms', 'settlement', 'paymentOrders', 'instructorPrivacyUnmask', 'none'] as const)

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
      queryClient.setQueryData(privacyQueryKey, dto)
      return dto
    },
    [memberId, privacyQueryKey, queryClient]
  )

  const reveal = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    revealPersonalInfo: kind === 'instructor' ? revealPersonalInfo : undefined,
    resetDeps: [isOpen, kind, instructorRowKey, memberId],
    controlMode: 'toggleRemask',
  })

  const { data: unmaskDto } = useQuery({
    queryKey: privacyQueryKey,
    enabled: kind === 'instructor' && memberId != null && reveal.personalInfoRevealed,
    staleTime: Infinity,
    queryFn: async (): Promise<InstructorMemberDetailResponse> => {
      const cached = queryClient.getQueryData<InstructorMemberDetailResponse>(privacyQueryKey)
      if (cached) return cached
      throw new Error('개인정보 원문 캐시를 찾을 수 없습니다.')
    },
    retry: false,
  })

  const instructorDetailWithPrivacy =
    kind === 'instructor' && detail && 'nameKo' in detail
      ? mergeInstructorDetailFromPrivacyUnmask(detail, unmaskDto)
      : null

  return {
    ...reveal,
    instructorDetailWithPrivacy,
    hasInstructorMemberId: memberId != null,
  }
}
