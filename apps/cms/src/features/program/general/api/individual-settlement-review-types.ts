/**
 * 개인 일정별 정산 심사(`/api/admin/individual-settlement-applications`) — 봉사자 정산 추가 필드.
 * 로컬 OpenAPI(orval)에 아직 없는 필드를 기능 계층에서만 확장한다. generated 파일은 수정하지 않는다.
 */
import type { IndividualSettlementReviewDetail } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewDetail'
import type { IndividualSettlementReviewListItem } from '@/shared/api/generated/dashboard/schemas/individualSettlementReviewListItem'

export const INDIVIDUAL_SETTLEMENT_REVIEW_APPLICATION_TYPES = ['INDIVIDUAL', 'VOLUNTEER'] as const

export type IndividualSettlementReviewApplicationType =
  (typeof INDIVIDUAL_SETTLEMENT_REVIEW_APPLICATION_TYPES)[number]

type VolunteerSettlementReviewFields = {
  /** 정산 신청 유형. 이전 BE 응답에는 없을 수 있다(없으면 INDIVIDUAL로 본다). */
  applicationType?: IndividualSettlementReviewApplicationType | string | null
  /** VOLUNTEER일 때만 값이 있다 — program_volunteer_application.id */
  volunteerApplicationId?: number | null
  /** VOLUNTEER 행에서는 null이다. */
  individualApplicationId?: number | null
}

export type IndividualSettlementReviewListItemView = Omit<
  IndividualSettlementReviewListItem,
  'individualApplicationId'
> &
  VolunteerSettlementReviewFields

export type IndividualSettlementReviewDetailView = Omit<
  IndividualSettlementReviewDetail,
  'individualApplicationId'
> &
  VolunteerSettlementReviewFields

export function resolveIndividualSettlementReviewApplicationType(
  value: string | null | undefined
): IndividualSettlementReviewApplicationType {
  return value?.trim().toUpperCase() === 'VOLUNTEER' ? 'VOLUNTEER' : 'INDIVIDUAL'
}

const APPLICATION_TYPE_LABEL: Record<IndividualSettlementReviewApplicationType, string> = {
  INDIVIDUAL: '참여자',
  VOLUNTEER: '봉사자',
}

/** 「구분」 표시 라벨 — 참여자 / 봉사자 */
export function individualSettlementReviewApplicationTypeLabel(
  value: string | null | undefined
): string {
  return APPLICATION_TYPE_LABEL[resolveIndividualSettlementReviewApplicationType(value)]
}
