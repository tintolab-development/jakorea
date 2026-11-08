/** @vitest-environment node */
import dayjs from 'dayjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  normalizeUjatTypedDetailForWrite,
  normalizeUjatTypedHalfPlanForWrite,
  type UjatTypedHalfPlan,
} from '@/features/program/ujat/lib/ujat-typed-detail'
import {
  patchUjatTypedDetail,
  putUjatTypedDetailHalf,
} from '@/features/program/ujat/api/ujat-typed-detail-client'
import { toCreateRequest } from '@/features/program/ujat/api/adapters'
import type { Program } from '@/types/domain'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

/**
 * Part6 FE 수용 기준: "UJAT 날짜 쓰기 페이로드에 number[] 날짜가 없다."
 * 위저드 생성 serviceDetailJson.ujatTypedDetail · 반기 PUT · typed-detail PATCH 모두 `"YYYY-MM-DD"` 문자열만.
 */

const http = vi.hoisted(() => ({
  calls: [] as Array<{ method: string; url: string; data: unknown }>,
}))
vi.mock('@/shared/api/orval-mutator', () => ({
  default: vi.fn(async (config: { method: string; url: string; data: unknown }) => {
    http.calls.push(JSON.parse(JSON.stringify(config)))
    return { revision: 1 }
  }),
}))

beforeEach(() => {
  http.calls.length = 0
})

const DATE_KEYS = new Set(['startDate', 'endDate', 'dates', 'excludedDates'])
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

/** JSON 으로 나간 typed 문서에서 날짜 필드 값이 문자열(또는 null·문자열 배열)인지 모은다 */
export function badTypedDates(json: unknown, path = '$'): string[] {
  if (Array.isArray(json)) return json.flatMap((v, i) => badTypedDates(v, `${path}[${i}]`))
  if (json == null || typeof json !== 'object') return []
  const out: string[] = []
  for (const [key, value] of Object.entries(json as Record<string, unknown>)) {
    const at = `${path}.${key}`
    if (DATE_KEYS.has(key)) {
      if (key === 'dates' || key === 'excludedDates') {
        if (value != null && !Array.isArray(value)) out.push(at)
        for (const [i, item] of (Array.isArray(value) ? value : []).entries()) {
          if (typeof item !== 'string' || !ISO_DATE.test(item)) out.push(`${at}[${i}]`)
        }
      } else if (value != null && (typeof value !== 'string' || !ISO_DATE.test(value))) {
        out.push(at)
      }
      continue
    }
    out.push(...badTypedDates(value, at))
  }
  return out
}

function mixedPlan(): UjatTypedHalfPlan {
  return {
    semesterType: 'FIRST_HALF',
    stages: [
      {
        stage: 'MAIN_EDUCATION',
        rows: [
          {
            rowId: 'row-1',
            displayOrder: 1,
            educationName: '본교육',
            educationMethod: 'OFFLINE',
            startDate: [2027, 3, 19] as unknown as string,
            endDate: new Date('2027-04-08T15:00:00.000Z') as unknown as string,
            dates: [dayjs('2027-03-19T00:00:00+09:00') as unknown as string],
            excludedDates: [[2027, 3, 26] as unknown as string, '2027-04-09'],
            scheduleIds: [],
          },
          {
            rowId: 'row-2',
            displayOrder: 2,
            educationName: '빈 값',
            educationMethod: 'OFFLINE',
            startDate: null,
            endDate: null,
            dates: [],
            excludedDates: [],
          },
          { rowId: 'row-3', displayOrder: 3, educationName: '생략', educationMethod: 'OFFLINE' },
        ],
      },
    ],
  }
}

describe('UJAT typed 날짜 쓰기 — 문자열만', () => {
  it('배열·Date·dayjs → "YYYY-MM-DD", null·[]·생략은 그대로', () => {
    const out = normalizeUjatTypedHalfPlanForWrite(mixedPlan())
    const rows = out.stages?.[0]?.rows ?? []
    expect(rows[0]).toMatchObject({
      startDate: '2027-03-19',
      endDate: '2027-04-09',
      dates: ['2027-03-19'],
      excludedDates: ['2027-03-26', '2027-04-09'],
    })
    expect(rows[1]).toMatchObject({ startDate: null, endDate: null, dates: [], excludedDates: [] })
    expect(rows[2]).not.toHaveProperty('startDate')
    expect(rows[2]).not.toHaveProperty('endDate')
    expect(rows[2]).not.toHaveProperty('dates')
    expect(rows[2]).not.toHaveProperty('excludedDates')
    expect(badTypedDates(JSON.parse(JSON.stringify(out)))).toEqual([])
  })

  it('기간 한쪽을 못 읽으면 기간 전체 null(배열을 그대로 보내지 않음)', () => {
    const plan = mixedPlan()
    const row = plan.stages![0]!.rows![0]!
    row.endDate = [2027, 13, 40] as unknown as string
    const out = normalizeUjatTypedHalfPlanForWrite(plan).stages![0]!.rows![0]!
    expect(out.startDate).toBeNull()
    expect(out.endDate).toBeNull()
  })

  it('반기 PUT 본문 — number[] 날짜 없음', async () => {
    await putUjatTypedDetailHalf(990100, 'FIRST_HALF', {
      expectedRevision: 2,
      halfPlan: mixedPlan(),
    })
    expect(http.calls).toHaveLength(1)
    expect(http.calls[0]).toMatchObject({
      method: 'PUT',
      url: '/api/admin/programs/990100/ujat/typed-detail/halves/FIRST_HALF',
    })
    expect(badTypedDates(http.calls[0]!.data)).toEqual([])
    expect((http.calls[0]!.data as { expectedRevision: number }).expectedRevision).toBe(2)
  })

  it('typed-detail PATCH 본문 — number[] 날짜 없음, 다른 키는 그대로', async () => {
    await patchUjatTypedDetail(990100, { halfPlans: [mixedPlan()], common: { a: 1 } })
    expect(badTypedDates(http.calls[0]!.data)).toEqual([])
    expect(http.calls[0]!.data).toMatchObject({ common: { a: 1 } })
    const noPlans = normalizeUjatTypedDetailForWrite<Record<string, unknown>>({ common: null })
    expect(noPlans).toEqual({ common: null })
  })

  it('위저드 생성 serviceDetailJson.ujatTypedDetail — number[] 날짜 없음', () => {
    const overlay = {
      'ujat.h1.event.name': '상반기 본교육',
      'ujat.h1.event.delivery': 'offline',
      'ujat.h1.event.range': {
        start: new Date('2027-03-18T15:00:00.000Z'),
        end: dayjs('2027-04-09T00:00:00+09:00'),
      },
      'ujat.h1.eduSchedule.unavailableDates': [new Date('2027-03-25T15:00:00.000Z'), '2027-04-09'],
      'ujat.h1.eduSchedule.exclusion': { excludeSaturday: true },
    }
    const program = {
      id: '990100',
      title: '[BOT-TEST-UJAT] dates',
      type: 'offline',
      format: 'course',
      category: 'school',
      rounds: [],
      startDate: '2027-01-01T00:00:00.000Z',
      endDate: '2027-12-31T23:59:59.999Z',
      status: 'active',
      lifecycleStatus: 'planned',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ujatRegistrationOverlay: overlay,
    } as unknown as Program
    const draft = { title: 'UJAT', paragraphs: [], formSettings: {} } as unknown as WritingFormDraft
    const request = toCreateRequest(program, { draft, overlay })
    const typed = (JSON.parse(request.serviceDetailJson ?? '{}') as Record<string, unknown>)
      .ujatTypedDetail
    expect(badTypedDates(typed)).toEqual([])
    expect(JSON.stringify(typed)).toContain('"startDate":"2027-03-19"')
    expect(JSON.stringify(typed)).toContain('"excludedDates":["2027-03-26","2027-04-09"]')
  })

  it('KST 자정 Instant·월말·연말·윤년 2월 29일을 YYYY-MM-DD로 유지한다', () => {
    const out = normalizeUjatTypedDetailForWrite({
      schemaVersion: 1,
      halfPlans: [
        {
          semesterType: 'FIRST_HALF',
          stages: [
            {
              stage: 'PRE_EDUCATION',
              rows: [
                {
                  rowId: 'pre-1',
                  startDate: '2027-03-08T15:00:00.000Z',
                  endDate: '2027-03-08T15:00:00.000Z',
                  excludedDates: ['2028-02-29', '2027-12-31', '2027-04-30'],
                },
              ],
            },
          ],
        },
      ],
    })
    const row = out.halfPlans?.[0]?.stages?.[0]?.rows?.[0]
    expect(row?.startDate).toBe('2027-03-09')
    expect(row?.endDate).toBe('2027-03-09')
    expect(row?.excludedDates).toEqual(['2028-02-29', '2027-12-31', '2027-04-30'])
  })

  it('excludeHoliday overlay 키를 excludeHoliday만 남긴다', () => {
    const out = normalizeUjatTypedHalfPlanForWrite({
      semesterType: 'FIRST_HALF',
      stages: [
        {
          stage: 'MAIN_EDUCATION',
          rows: [
            {
              rowId: 'main-1',
              exclusion: { excludeHoliday: true, excludeSaturday: false } as never,
            },
          ],
        },
      ],
    })
    expect(out.stages?.[0]?.rows?.[0]?.exclusion).toEqual({
      excludeSaturday: false,
      excludeHoliday: true,
    })
    expect(JSON.stringify(out)).not.toContain('excludePublicHoliday')
  })

  it('exclusion omit/null/false를 서로 다른 값으로 유지하고 구키는 버린다', () => {
    const out = normalizeUjatTypedHalfPlanForWrite({
      semesterType: 'FIRST_HALF',
      stages: [
        {
          stage: 'MAIN_EDUCATION',
          rows: [
            {
              rowId: 'null-holiday',
              exclusion: {
                excludeNone: false,
                excludeSaturday: false,
                excludeSunday: false,
                excludeHoliday: null,
                excludePublicHoliday: true,
              } as never,
            },
          ],
        },
      ],
    })
    expect(out.stages?.[0]?.rows?.[0]?.exclusion).toEqual({
      excludeNone: false,
      excludeSaturday: false,
      excludeSunday: false,
      excludeHoliday: null,
    })
    expect(JSON.stringify(out)).not.toContain('excludePublicHoliday')
  })
})
