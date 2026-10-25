/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syncStoredUjatTypedHalves } from '@/features/program/ujat/api/ujat-typed-detail-sync'

/**
 * Part6(UJAT typed 날짜 문자열 쓰기) 전 parity — 3cb760062에서 만든 스냅샷.
 * typed-detail GET 이 레거시 배열 날짜를 주는 경우에도 반기 PUT 본문이 어떻게 나가는지 고정한다.
 */

const client = vi.hoisted(() => ({
  fetchUjatTypedDetail: vi.fn(),
  putUjatTypedDetailHalf: vi.fn(),
  patchUjatTypedDetail: vi.fn(),
}))
vi.mock('@/features/program/ujat/api/ujat-typed-detail-client', () => client)

/** ujat-halves-save-parity 의 반기 overlay 중 반기 계획 키만 */
const UJAT_HALF_OVERLAY: Record<string, unknown> = {
  'ujat.h1.pre.name': '상반기 사전교육(발대식)',
  'ujat.h1.pre.delivery': 'online',
  'ujat.h1.event.name': '상반기 학교 경제교육',
  'ujat.h1.event.range': { start: '2027-04-01T15:00:00.000Z', end: '2027-06-17T15:00:00.000Z' },
  'ujat.h1.event.delivery': 'offline',
  'ujat.h1.closing.name': '상반기 해단식',
  'ujat.h1.closing.delivery': 'online',
  'ujat.h1.eduSchedule.unavailableDates': ['2027-05-05', '2027-05-06T15:00:00.000Z'],
  'ujat.h1.eduSchedule.exclusion': {
    excludeNone: false,
    excludeSaturday: true,
    excludeSunday: true,
    excludeHoliday: true,
  },
  'ujat.h2.event.name': '하반기 학교 경제교육',
  'ujat.h2.event.range': { start: '2027-09-09T15:00:00.000Z', end: '2027-11-18T15:00:00.000Z' },
  'ujat.h2.event.delivery': 'hybrid',
  'ujat.h2.eduSchedule.unavailableDates': [],
  'ujat.h2.eduSchedule.exclusion': {
    excludeNone: true,
    excludeSaturday: false,
    excludeSunday: false,
    excludeHoliday: true,
  },
}

const LEGACY_ARRAY_TYPED_DETAIL = {
  schemaVersion: 1,
  revision: 3,
  halfPlans: [
    {
      semesterType: 'FIRST_HALF',
      stages: [
        {
          stage: 'MAIN_EDUCATION',
          rows: [
            {
              rowId: 'legacy-FIRST_HALF-MAIN_EDUCATION',
              displayOrder: 1,
              educationName: '상반기 학교 경제교육',
              educationMethod: 'offline',
              startDate: [2027, 4, 2],
              endDate: [2027, 6, 18],
              dates: [
                [2027, 4, 9],
                [2027, 7, 1],
              ],
              excludedDates: [[2027, 5, 5]],
              scheduleIds: [],
            },
            {
              rowId: 'row-tool-1',
              displayOrder: 2,
              educationName: '도구 행',
              educationMethod: 'OFFLINE',
              startDate: [2027, 4, 2],
              endDate: [2027, 4, 30],
              dates: [[2027, 4, 9]],
              excludedDates: [],
              scheduleIds: [],
            },
          ],
        },
      ],
    },
  ],
}

beforeEach(() => {
  client.fetchUjatTypedDetail.mockReset()
  client.putUjatTypedDetailHalf.mockReset()
  client.putUjatTypedDetailHalf.mockImplementation(
    async (_id: unknown, _semester: unknown, body: { expectedRevision: number }) => ({
      revision: body.expectedRevision + 1,
    })
  )
})

describe('UJAT typed 날짜 쓰기 parity (part6)', () => {
  it('레거시 배열 날짜가 있는 typed-detail GET → 반기 PUT 본문', async () => {
    client.fetchUjatTypedDetail.mockResolvedValue(structuredClone(LEGACY_ARRAY_TYPED_DETAIL))
    await syncStoredUjatTypedHalves(990100, UJAT_HALF_OVERLAY)
    expect(client.putUjatTypedDetailHalf.mock.calls).toMatchSnapshot()
  })
})
