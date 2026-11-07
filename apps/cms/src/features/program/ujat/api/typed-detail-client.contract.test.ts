import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/orval-mutator', () => ({
  default: request,
}))

import {
  fetchUjatTypedDetailRemote,
  patchUjatTypedDetailRemote,
  replaceUjatTypedDetailRemote,
  syncUjatTypedDetailPhysicalSchedulesRemote,
  syncUjatTypedDetailRowSchedulesRemote,
  typedScheduleRequestsForRow,
  updateUjatTypedDetailHalfRemote,
} from './typed-detail-client'

describe('UJAT Typed detail HTTP contract', () => {
  beforeEach(() => {
    request.mockReset()
    request.mockResolvedValue({ schemaVersion: 1, halfPlans: [], common: null })
  })

  it('GET uses the backend typed-detail route and returns the raw DTO', async () => {
    await fetchUjatTypedDetailRemote('186264')

    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186264/ujat/typed-detail',
      method: 'GET',
    })
  })

  it('PUT sends the complete typed document without a legacy overlay envelope', async () => {
    const detail = { schemaVersion: 1, halfPlans: [], common: null }
    await replaceUjatTypedDetailRemote('186264', detail)

    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186264/ujat/typed-detail',
      method: 'PUT',
      data: detail,
    })
  })

  it('ISO instant 날짜가 VALIDATION_FAILED면 YYYY-MM-DD로 다시 보낸다', async () => {
    request
      .mockRejectedValueOnce({
        response: { data: { error: { code: 'VALIDATION_FAILED', field: 'startDate' } } },
      })
      .mockResolvedValueOnce({ schemaVersion: 1, halfPlans: [] })

    await replaceUjatTypedDetailRemote('186558', {
      schemaVersion: 1,
      halfPlans: [
        {
          semesterType: 'FIRST_HALF',
          stages: [
            {
              stage: 'MAIN_EDUCATION',
              rows: [
                {
                  startDate: '2027-03-08T15:00:00.000Z',
                  endDate: '2027-03-08T15:00:00.000Z',
                  exclusion: { excludeHoliday: true },
                },
              ],
            },
          ],
        },
      ],
    })

    expect(request).toHaveBeenCalledTimes(2)
    const first = request.mock.calls[0]?.[0] as { data: { halfPlans: Array<{ stages: Array<{ rows: Array<{ startDate: string; exclusion: unknown }> }> }> } }
    const second = request.mock.calls[1]?.[0] as { data: { halfPlans: Array<{ stages: Array<{ rows: Array<{ startDate: string; exclusion: unknown }> }> }> } }
    expect(first.data.halfPlans[0].stages[0].rows[0].startDate).toBe('2027-03-09')
    expect(second.data.halfPlans[0].stages[0].rows[0].startDate).toBe('2027-03-09')
    expect(JSON.stringify(first.data.halfPlans[0].stages[0].rows[0].exclusion)).not.toContain(
      'excludePublicHoliday'
    )
  })

  it('PATCH uses JSON Merge Patch semantics', async () => {
    const patch = { common: { surveySettings: [] } }
    await patchUjatTypedDetailRemote('186264', patch)

    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186264/ujat/typed-detail',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/merge-patch+json' },
      data: patch,
    })
  })

  it('updates one semester with the server revision and typed half plan', async () => {
    const halfPlan = { semesterType: 'FIRST_HALF' as const, stages: [] }
    await updateUjatTypedDetailHalfRemote('186264', 'FIRST_HALF', 7, halfPlan)

    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186264/ujat/typed-detail/halves/FIRST_HALF',
      method: 'PUT',
      data: { expectedRevision: 7, halfPlan },
    })
  })

  it('replaces physical schedules for a stable typed row without overlay data', async () => {
    const schedules = [
      {
        id: 187001,
        scheduleName: '상반기 본교육',
        startAt: '2027-04-01T00:00:00+09:00',
        endAt: '2027-04-01T23:59:59+09:00',
        allDay: true,
        scheduleRole: 'EDUCATION' as const,
      },
    ]
    await syncUjatTypedDetailRowSchedulesRemote(
      '186264',
      'FIRST_HALF',
      'MAIN_EDUCATION',
      'h1-main-1',
      8,
      schedules
    )

    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186264/ujat/typed-detail/halves/FIRST_HALF/stages/MAIN_EDUCATION/rows/h1-main-1/schedules',
      method: 'PUT',
      data: { expectedRevision: 8, schedules },
    })
  })

  it('syncs every physical schedule row from the saved half plan with the latest revision', async () => {
    const detail = {
      schemaVersion: 1,
      revision: 9,
      common: null,
      halfPlans: [
        {
          semesterType: 'FIRST_HALF' as const,
          stages: [
            {
              stage: 'MAIN_EDUCATION' as const,
              rows: [
                {
                  rowId: 'h1-main-1',
                  displayOrder: 1,
                  educationName: '상반기 본교육',
                  dates: ['2027-04-01'],
                  scheduleIds: [187001],
                  endDate: '2027-04-01',
                },
              ],
            },
          ],
        },
      ],
    }
    request.mockResolvedValue(detail)

    await syncUjatTypedDetailPhysicalSchedulesRemote('186264', detail, ['FIRST_HALF'])

    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith({
      url: '/api/admin/programs/186264/ujat/typed-detail/halves/FIRST_HALF/stages/MAIN_EDUCATION/rows/h1-main-1/schedules',
      method: 'PUT',
      data: {
        expectedRevision: 9,
        schedules: [
          expect.objectContaining({
            id: 187001,
            scheduleRole: 'EDUCATION',
          }),
        ],
      },
    })
  })

  it('keeps existing physical schedule ids and never invents line ids', () => {
    expect(
      typedScheduleRequestsForRow(
        {
          rowId: 'h1-main-1',
          displayOrder: 1,
          educationName: '상반기 본교육',
          dates: ['2027-04-01'],
          scheduleIds: [187001],
          endDate: '2027-04-01',
        },
        'MAIN_EDUCATION'
      )
    ).toEqual([
      expect.objectContaining({
        id: 187001,
        scheduleRole: 'EDUCATION',
      }),
    ])
    expect(
      typedScheduleRequestsForRow(
        { rowId: 'h1-main-2', educationName: '본교육', dates: ['2027-04-02'] },
        'MAIN_EDUCATION'
      )[0]
    ).not.toHaveProperty('educationSlotKey')
  })
})
