/**
 * 지급 현황 상세(신청자) — 회원 privacy/unmask
 *
 * 강사 행이 하나라도 있으면 강사 회원 상세·원문 API, 참여자·봉사자(영수증 정산) 행만 있으면 개인회원 상세·원문 API를 쓴다.
 * (참여자·봉사자에게 강사 API를 부르면 INSTRUCTOR_PROFILE_NOT_FOUND 404가 난다)
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
  fetchIndividualMemberDetailRemote,
  fetchInstructorMemberDetailRemote,
  unmaskIndividualMemberPrivacyRemote,
  unmaskInstructorMemberPrivacyRemote,
} from '@/features/user/api/members-api-client'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import type { IndividualMemberDetailResponse } from '@/shared/api/generated/members/schemas/individualMemberDetailResponse'
import type { InstructorMemberDetailResponse } from '@/shared/api/generated/members/schemas/instructorMemberDetailResponse'
import {
  applyLatestReceiptPayeeAccount,
  mergeInstructorDetailFromIndividualMember,
  mergeInstructorDetailFromMaskedMember,
  mergeInstructorDetailFromPrivacyUnmask,
} from './merge-instructor-detail-from-privacy-unmask'

type DetailForPrivacy = PaymentOrderAdminProgramDetail | PaymentOrderAdminInstructorDetail

/** 기본 정보·원문을 읽을 회원 API 종류 */
export type PaymentOrderPrivacyMemberSource = 'instructor' | 'individual'

type MemberPrivacyDto =
  | { source: 'instructor'; dto: InstructorMemberDetailResponse }
  | { source: 'individual'; dto: IndividualMemberDetailResponse }

/**
 * 상세 라인이 모두 참여자·봉사자 행이면 개인회원, 강사 행이 하나라도 있거나 라인이 없으면 강사.
 * 상세를 아직 못 받았으면 null(조회하지 않음) — 참여자에게 강사 API가 먼저 나가지 않게 한다.
 */
export function resolvePaymentOrderPrivacyMemberSource(
  detail: DetailForPrivacy | null
): PaymentOrderPrivacyMemberSource | null {
  if (!detail || !('nameKo' in detail)) return null
  const rows = detail.programRows ?? []
  const receiptOnly =
    rows.length > 0 &&
    rows.every(row => row.payeeType === 'PARTICIPANT' || row.payeeType === 'VOLUNTEER')
  return receiptOnly ? 'individual' : 'instructor'
}

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
  const memberSource = kind === 'instructor' ? resolvePaymentOrderPrivacyMemberSource(detail) : null

  /** 원문 응답과 요청 당시 회원 ID·API 종류. 다른 회원·종류로 바뀌면 쓰지 않는다. */
  const [revealedPrivacy, setRevealedPrivacy] = useState<
    ({ memberId: number } & MemberPrivacyDto) | null
  >(null)

  const maskedQueryKey = useMemo(
    () =>
      memberId != null
        ? ([
            ...settlementQueryKeys.paymentOrders.instructorPrivacyUnmask(memberId),
            'masked',
            memberSource ?? 'unknown',
          ] as const)
        : (['cms', 'settlement', 'paymentOrders', 'instructorPrivacyMasked', 'none'] as const),
    [memberId, memberSource]
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
      if (memberSource === 'individual') {
        const dto = await unmaskIndividualMemberPrivacyRemote(memberId, { reason })
        return { memberId, source: 'individual' as const, dto }
      }
      const dto = await unmaskInstructorMemberPrivacyRemote(memberId, { reason })
      return { memberId, source: 'instructor' as const, dto }
    },
    [memberId, memberSource]
  )

  const handlePrivacyUnmasked = useCallback((payload: unknown) => {
    const next = payload as ({ memberId: number } & MemberPrivacyDto) | undefined
    if (next?.dto) setRevealedPrivacy(next)
  }, [])

  const clearRevealedPrivacy = useCallback(() => setRevealedPrivacy(null), [])

  const reveal = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    revealPersonalInfo: kind === 'instructor' ? revealPersonalInfo : undefined,
    onPrivacyUnmasked: handlePrivacyUnmasked,
    onRemask: clearRevealedPrivacy,
    resetDeps: [isOpen, kind, instructorRowKey, memberId, memberSource],
    controlMode: 'toggleRemask',
  })

  const { data: masked } = useQuery({
    queryKey: maskedQueryKey,
    enabled:
      kind === 'instructor' &&
      memberId != null &&
      memberSource != null &&
      isOpen &&
      !reveal.personalInfoRevealed,
    staleTime: 60_000,
    queryFn: async (): Promise<MemberPrivacyDto> => {
      if (memberId == null) {
        throw new Error('강사 회원 ID가 없습니다.')
      }
      if (memberSource === 'individual') {
        return { source: 'individual', dto: await fetchIndividualMemberDetailRemote(memberId) }
      }
      return { source: 'instructor', dto: await fetchInstructorMemberDetailRemote(memberId) }
    },
    retry: false,
  })

  const unmasked =
    reveal.personalInfoRevealed &&
    revealedPrivacy != null &&
    revealedPrivacy.memberId === memberId &&
    revealedPrivacy.source === memberSource
      ? revealedPrivacy
      : undefined
  const maskedForSource = masked != null && masked.source === memberSource ? masked : undefined

  let instructorDetailWithPrivacy: PaymentOrderAdminInstructorDetail | null = null
  if (kind === 'instructor' && detail && 'nameKo' in detail) {
    if (memberSource === 'individual') {
      // 참여자·봉사자 — 개인회원 정보 + 가장 최근 신청 건의 정산 계좌(기획 9번)
      const base = applyLatestReceiptPayeeAccount(detail)
      instructorDetailWithPrivacy = reveal.personalInfoRevealed
        ? mergeInstructorDetailFromIndividualMember(
            base,
            unmasked?.source === 'individual' ? unmasked.dto : undefined,
            { includeName: true }
          )
        : mergeInstructorDetailFromIndividualMember(
            base,
            maskedForSource?.source === 'individual' ? maskedForSource.dto : undefined
          )
    } else {
      instructorDetailWithPrivacy = reveal.personalInfoRevealed
        ? mergeInstructorDetailFromPrivacyUnmask(
            detail,
            unmasked?.source === 'instructor' ? unmasked.dto : undefined
          )
        : mergeInstructorDetailFromMaskedMember(
            detail,
            maskedForSource?.source === 'instructor' ? maskedForSource.dto : undefined
          )
    }
  }

  return {
    ...reveal,
    instructorDetailWithPrivacy,
    hasInstructorMemberId: memberId != null,
  }
}
