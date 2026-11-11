import { beforeEach, describe, expect, it, vi } from 'vitest'

const { customInstanceMock } = vi.hoisted(() => ({
  customInstanceMock: vi.fn(),
}))

vi.mock('@/shared/api/orval-mutator', () => ({
  default: customInstanceMock,
  customInstance: customInstanceMock,
}))

import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL } from '@/features/program/general/api/individual-settlement-review-remote'
import type { IndividualSettlementReviewListItemView } from '@/features/program/general/api/individual-settlement-review-types'
import {
  fetchAllVolunteerSettlementReviewItemsRemote,
  fetchVolunteerReceiptSettlementReviewsRemote,
  filterVolunteerSettlementReviewItems,
  hasVolunteerReceiptSettlementTarget,
  volunteerReceiptSettlementListQueryOptions,
  volunteerReceiptSettlementReviewKey,
  VOLUNTEER_SETTLEMENT_REVIEW_MAX_PAGES,
  VOLUNTEER_SETTLEMENT_REVIEW_PAGE_SIZE,
} from './volunteer-settlement-review-remote'

function item(
  overrides: Partial<IndividualSettlementReviewListItemView>
): IndividualSettlementReviewListItemView {
  return {
    settlementApplicationId: 1,
    programScheduleId: 10,
    status: 'SUBMITTED',
    applicationType: 'VOLUNTEER',
    volunteerApplicationId: 1691646,
    individualApplicationId: null,
    ...overrides,
  }
}

function page(items: IndividualSettlementReviewListItemView[], totalPages?: number) {
  return { success: true, data: { items, page: 0, size: 100, totalPages } }
}

describe('volunteer settlement review remote', () => {
  beforeEach(() => {
    customInstanceMock.mockReset()
  })

  it('filters by volunteerApplicationId and drops non-volunteer rows', () => {
    const rows = [
      item({ settlementApplicationId: 1, volunteerApplicationId: 1691646 }),
      item({ settlementApplicationId: 2, volunteerApplicationId: 1691675 }),
      item({ settlementApplicationId: 3, applicationType: 'INDIVIDUAL', volunteerApplicationId: 1691646 }),
      item({ settlementApplicationId: 4, applicationType: undefined, volunteerApplicationId: 1691646 }),
    ]
    expect(filterVolunteerSettlementReviewItems(rows, '1691646').map(r => r.settlementApplicationId)).toEqual([1])
    expect(filterVolunteerSettlementReviewItems(rows, '')).toEqual([])
  })

  it('builds review keys that do not collide with participant keys', () => {
    expect(volunteerReceiptSettlementReviewKey({ kind: 'participant', participantId: ' 55 ' })).toBe('55')
    expect(
      volunteerReceiptSettlementReviewKey({ kind: 'volunteerApplication', volunteerApplicationId: '1691646' })
    ).toBe('volunteer-application:1691646')
  })

  it('requires a positive numeric target id', () => {
    expect(hasVolunteerReceiptSettlementTarget({ kind: 'participant', participantId: '55' })).toBe(true)
    expect(hasVolunteerReceiptSettlementTarget({ kind: 'participant', participantId: '' })).toBe(false)
    expect(
      hasVolunteerReceiptSettlementTarget({ kind: 'volunteerApplication', volunteerApplicationId: 'h1-vol-1' })
    ).toBe(false)
  })

  it('pages until totalPages and always sends applicationType=VOLUNTEER', async () => {
    customInstanceMock
      .mockResolvedValueOnce(page([item({ settlementApplicationId: 1 })], 2))
      .mockResolvedValueOnce(page([item({ settlementApplicationId: 2 })], 2))
    const rows = await fetchAllVolunteerSettlementReviewItemsRemote({ programId: '186495' })
    expect(rows.map(r => r.settlementApplicationId)).toEqual([1, 2])
    expect(customInstanceMock).toHaveBeenCalledTimes(2)
    expect(customInstanceMock).toHaveBeenNthCalledWith(1, {
      url: INDIVIDUAL_SETTLEMENT_REVIEW_LIST_URL,
      method: 'GET',
      params: {
        programId: 186495,
        applicationType: 'VOLUNTEER',
        page: 0,
        size: VOLUNTEER_SETTLEMENT_REVIEW_PAGE_SIZE,
      },
    })
    expect(customInstanceMock.mock.calls[1]?.[0]).toMatchObject({ params: { page: 1 } })
  })

  it('stops on a short page when totalPages is missing, and caps the page count', async () => {
    customInstanceMock.mockResolvedValueOnce(page([item({})]))
    await fetchAllVolunteerSettlementReviewItemsRemote({ programId: '1' })
    expect(customInstanceMock).toHaveBeenCalledTimes(1)

    customInstanceMock.mockReset()
    const full = Array.from({ length: VOLUNTEER_SETTLEMENT_REVIEW_PAGE_SIZE }, (_, i) =>
      item({ settlementApplicationId: i + 1 })
    )
    customInstanceMock.mockResolvedValue(page(full, 999))
    await fetchAllVolunteerSettlementReviewItemsRemote({ programId: '1' })
    expect(customInstanceMock).toHaveBeenCalledTimes(VOLUNTEER_SETTLEMENT_REVIEW_MAX_PAGES)
  })

  it('uses the participantId filter for general volunteers', async () => {
    customInstanceMock.mockResolvedValueOnce(page([item({ volunteerApplicationId: 777 })], 1))
    const rows = await fetchVolunteerReceiptSettlementReviewsRemote({
      programId: '186408',
      target: { kind: 'participant', participantId: '55' },
    })
    expect(rows).toHaveLength(1)
    expect(customInstanceMock.mock.calls[0]?.[0]).toMatchObject({
      params: { programId: 186408, participantId: 55, applicationType: 'VOLUNTEER' },
    })
  })

  it('reads the whole program and filters client-side for UJAT volunteers', async () => {
    customInstanceMock.mockResolvedValueOnce(
      page(
        [
          item({ settlementApplicationId: 1, volunteerApplicationId: 1691646 }),
          item({ settlementApplicationId: 2, volunteerApplicationId: 1691675 }),
        ],
        1
      )
    )
    const rows = await fetchVolunteerReceiptSettlementReviewsRemote({
      programId: '186495',
      target: { kind: 'volunteerApplication', volunteerApplicationId: '1691646' },
    })
    expect(rows.map(r => r.settlementApplicationId)).toEqual([1])
    expect(customInstanceMock.mock.calls[0]?.[0].params).not.toHaveProperty('participantId')
  })

  it('keys the list under the prefix the review mutations invalidate', () => {
    const options = volunteerReceiptSettlementListQueryOptions({
      programId: '186495',
      target: { kind: 'volunteerApplication', volunteerApplicationId: '1691646' },
    })
    const prefix = generalProgramProgressQueryKeys.individualSettlementReviews(
      '186495',
      'volunteer-application:1691646'
    )
    expect(options.queryKey.slice(0, prefix.length)).toEqual(prefix)
  })
})
