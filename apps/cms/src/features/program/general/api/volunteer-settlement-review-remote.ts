/**
 * 봉사자 영수증 정산 — 개인 일정별 정산 심사 API(`applicationType=VOLUNTEER`) 조회.
 *
 * 봉사자 한 명을 고르는 기준:
 * - `participant`: 일반 프로그램 참여 봉사자. 행 id가 participants API `participantId`(= program_participant.id)라
 *   BE `participantId` 필터를 그대로 쓴다.
 * - `volunteerApplication`: UJAT 봉사자 상세. 화면이 봉사 신청 id(program_volunteer_application.id)만 갖고 있어
 *   프로그램 단위로 끝까지 읽은 뒤 `volunteerApplicationId`로 거른다(BE에 봉사 신청 id 필터 없음).
 */
import { queryOptions } from '@tanstack/react-query'
import { customInstance } from '@/shared/api/orval-mutator'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  buildIndividualSettlementReviewListParams,
  INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL,
  parseIndividualSettlementNumericId,
  unwrapIndividualSettlementReviewListPage,
} from '@/features/program/general/api/individual-settlement-review-remote'
import {
  resolveIndividualSettlementReviewApplicationType,
  type IndividualSettlementReviewListItemView,
} from '@/features/program/general/api/individual-settlement-review-types'

export type VolunteerReceiptSettlementTarget =
  | { kind: 'participant'; participantId: string }
  | { kind: 'volunteerApplication'; volunteerApplicationId: string }

/** 한 번에 읽는 행 수와 상한 — 프로그램 단위 조회가 끝나지 않는 경우를 막는다 */
export const VOLUNTEER_SETTLEMENT_REVIEW_PAGE_SIZE = 100
export const VOLUNTEER_SETTLEMENT_REVIEW_MAX_PAGES = 50

/**
 * 심사 상세 모달·목록 무효화에 쓰는 대상 키.
 * `individualSettlementReviews(programId, key)` 접두사로 무효화되므로 참여자 키와 겹치지 않게 둔다.
 */
export function volunteerReceiptSettlementReviewKey(target: VolunteerReceiptSettlementTarget): string {
  return target.kind === 'participant'
    ? target.participantId.trim()
    : `volunteer-application:${target.volunteerApplicationId.trim()}`
}

export function hasVolunteerReceiptSettlementTarget(
  target: VolunteerReceiptSettlementTarget
): boolean {
  const id = target.kind === 'participant' ? target.participantId : target.volunteerApplicationId
  return parseIndividualSettlementNumericId(id) != null
}

/** 봉사 신청 id로 거른다. 신청 유형이 VOLUNTEER가 아닌 행은 버린다. */
export function filterVolunteerSettlementReviewItems(
  items: ReadonlyArray<IndividualSettlementReviewListItemView>,
  volunteerApplicationId: string | number
): IndividualSettlementReviewListItemView[] {
  const targetId = parseIndividualSettlementNumericId(volunteerApplicationId)
  if (targetId == null) return []
  return items.filter(
    item =>
      resolveIndividualSettlementReviewApplicationType(item.applicationType) === 'VOLUNTEER' &&
      parseIndividualSettlementNumericId(item.volunteerApplicationId) === targetId
  )
}

/** 프로그램의 봉사자 정산 신청을 마지막 페이지까지 읽는다. */
export async function fetchAllVolunteerSettlementReviewItemsRemote(input: {
  programId: string
  participantId?: string
}): Promise<IndividualSettlementReviewListItemView[]> {
  const out: IndividualSettlementReviewListItemView[] = []
  for (let page = 0; page < VOLUNTEER_SETTLEMENT_REVIEW_MAX_PAGES; page += 1) {
    const response = await customInstance<unknown>({
      url: INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL,
      method: 'GET',
      params: buildIndividualSettlementReviewListParams({
        programId: input.programId,
        participantId: input.participantId,
        applicationType: 'VOLUNTEER',
        page,
        size: VOLUNTEER_SETTLEMENT_REVIEW_PAGE_SIZE,
      }),
    })
    const body = unwrapIndividualSettlementReviewListPage(response)
    const items = (body.items ?? []) as IndividualSettlementReviewListItemView[]
    out.push(...items)
    const totalPages = typeof body.totalPages === 'number' ? body.totalPages : null
    const lastPage = totalPages != null ? page + 1 >= totalPages : items.length < VOLUNTEER_SETTLEMENT_REVIEW_PAGE_SIZE
    if (lastPage || items.length === 0) break
  }
  return out
}

export async function fetchVolunteerReceiptSettlementReviewsRemote(input: {
  programId: string
  target: VolunteerReceiptSettlementTarget
}): Promise<IndividualSettlementReviewListItemView[]> {
  if (input.target.kind === 'participant') {
    return fetchAllVolunteerSettlementReviewItemsRemote({
      programId: input.programId,
      participantId: input.target.participantId,
    })
  }
  const items = await fetchAllVolunteerSettlementReviewItemsRemote({ programId: input.programId })
  return filterVolunteerSettlementReviewItems(items, input.target.volunteerApplicationId)
}

export function volunteerReceiptSettlementListQueryOptions(input: {
  programId: string
  target: VolunteerReceiptSettlementTarget
}) {
  return queryOptions({
    queryKey: [
      ...generalProgramProgressQueryKeys.individualSettlementReviews(
        input.programId,
        volunteerReceiptSettlementReviewKey(input.target)
      ),
      'VOLUNTEER',
    ] as const,
    staleTime: 30_000,
    queryFn: () => fetchVolunteerReceiptSettlementReviewsRemote(input),
  })
}
