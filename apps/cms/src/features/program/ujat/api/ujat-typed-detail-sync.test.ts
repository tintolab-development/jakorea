import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ fetch: vi.fn(), put: vi.fn() }))
vi.mock('./ujat-typed-detail-client', () => ({
  fetchUjatTypedDetail: (...args: unknown[]) => mocks.fetch(...args),
  putUjatTypedDetailHalf: (...args: unknown[]) => mocks.put(...args),
}))

import { buildUjatTypedDetailForCreate } from '@/features/program/ujat/lib/ujat-typed-detail'
import { syncStoredUjatTypedHalves } from './ujat-typed-detail-sync'

const overlay: Record<string, unknown> = {
  'ujat.h1.event.name': '상반기 교육',
  'ujat.h1.event.delivery': 'offline',
  'ujat.h1.event.range': { start: '2027-04-01T15:00:00.000Z', end: '2027-06-17T15:00:00.000Z' },
  'ujat.h1.eduSchedule.unavailableDates': ['2027-05-05'],
  'ujat.h1.eduSchedule.exclusion': {
    excludeNone: false,
    excludeSaturday: true,
    excludeSunday: true,
    excludeHoliday: false,
  },
}

describe('syncStoredUjatTypedHalves', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('저장된 반기와 overlay 가 같으면 PUT 하지 않는다', async () => {
    mocks.fetch.mockResolvedValue({ ...buildUjatTypedDetailForCreate(overlay), revision: 3 })
    const result = await syncStoredUjatTypedHalves(990100, overlay)
    expect(mocks.put).not.toHaveBeenCalled()
    expect(result.sentHalves).toEqual([])
  })

  it('바뀐 반기만 expectedRevision 과 함께 PUT 하고, 지역·scheduleIds 는 유지한다', async () => {
    const stored = buildUjatTypedDetailForCreate(overlay)
    const mainRow = stored.halfPlans?.[0]?.stages?.[0]?.rows?.[0]
    if (!mainRow) throw new Error('fixture')
    mainRow.regionCode = 'seoul'
    mainRow.scheduleIds = [7001]
    mainRow.dates = ['2027-04-02', '2027-04-09']
    mocks.fetch.mockResolvedValue({ ...stored, revision: 3 })
    mocks.put.mockResolvedValue({ revision: 4 })
    const edited = {
      ...overlay,
      'ujat.h1.event.range': { start: '2027-04-08T15:00:00.000Z', end: '2027-06-17T15:00:00.000Z' },
    }
    const result = await syncStoredUjatTypedHalves(990100, edited)
    expect(mocks.put).toHaveBeenCalledOnce()
    const [pid, semester, body] = mocks.put.mock.calls[0] as [
      number,
      string,
      { expectedRevision: number; halfPlan: { stages: Array<{ rows: unknown[] }> } },
    ]
    expect(pid).toBe(990100)
    expect(semester).toBe('FIRST_HALF')
    expect(body.expectedRevision).toBe(3)
    const row = body.halfPlan.stages[0].rows[0]
    expect(row).toMatchObject({
      rowId: 'legacy-FIRST_HALF-MAIN_EDUCATION',
      educationName: '상반기 교육',
      educationMethod: 'offline',
      regionCode: 'seoul',
      scheduleIds: [7001],
      startDate: '2027-04-09',
      endDate: '2027-06-18',
      dates: ['2027-04-09'],
      excludedDates: ['2027-05-05'],
      exclusion: {
        excludeNone: false,
        excludeSaturday: true,
        excludeSunday: true,
        excludePublicHoliday: false,
      },
    })
    expect(result).toEqual({ sentHalves: ['FIRST_HALF'], revision: 4 })
  })

  it('두 반기가 다 바뀌면 두 번째 PUT 은 첫 응답 revision 을 쓴다', async () => {
    mocks.fetch.mockResolvedValue({ schemaVersion: 1, halfPlans: [], revision: 0 })
    mocks.put.mockResolvedValueOnce({ revision: 1 }).mockResolvedValueOnce({ revision: 2 })
    await syncStoredUjatTypedHalves(990100, { ...overlay, 'ujat.h2.event.name': '하반기' })
    expect(
      mocks.put.mock.calls.map(c => [c[1], (c[2] as { expectedRevision: number }).expectedRevision])
    ).toEqual([
      ['FIRST_HALF', 0],
      ['SECOND_HALF', 1],
    ])
  })
})
