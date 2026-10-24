import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/orval-mutator', () => ({
  default: request,
}))

import {
  fetchUjatTypedDetailRemote,
  patchUjatTypedDetailRemote,
  replaceUjatTypedDetailRemote,
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
