import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ProgramResponse } from '@/shared/api/generated/dashboard/schemas/programResponse'
import { fromDetail } from '@/features/program/ujat/api/adapters'
import fixture from './__fixtures__/stored-ujat-typed-detail-186383.json'
import {
  applyStoredUjatTypedHalvesToOverlay,
  parseStoredUjatTypedDetail,
  ujatTypedDate,
} from './ujat-typed-detail'

/** 186383 형태 — BE UjatTypedDetailSupport MAPPER 가 LocalDate 를 `[y,m,d]` 배열로 저장한 문서 */
function detailDto(serviceDetail: Record<string, unknown>): ProgramResponse {
  return {
    id: 186383,
    programType: 'UJAT',
    title: '[BOT-TEST-UJAT] fixture',
    serviceDetailJson: JSON.stringify(serviceDetail),
  } as unknown as ProgramResponse
}

const H1_KEYS = {
  range: 'ujat.h1.event.range',
  unavailable: 'ujat.h1.eduSchedule.unavailableDates',
} as const

afterEach(() => {
  vi.restoreAllMocks()
})

describe('저장 typed 문서의 Jackson 배열 날짜 (186383 회귀)', () => {
  it('ujatTypedDate 는 [y,m,d] 와 [y,m,d,h,mi,s?,nanos?] 를 읽고, 잘못된 배열은 null', () => {
    expect(ujatTypedDate([2027, 3, 19])).toBe('2027-03-19')
    expect(ujatTypedDate([2027, 3, 19, 23, 30])).toBe('2027-03-19')
    expect(ujatTypedDate([2027, 3, 19, 0, 0, 5, 120_000_000])).toBe('2027-03-19')
    expect(ujatTypedDate([2027, 2, 30])).toBeNull()
    expect(ujatTypedDate([2027, 13, 1])).toBeNull()
    expect(ujatTypedDate([2027, 3])).toBeNull()
    expect(ujatTypedDate(['2027', 3, 19])).toBeNull()
    expect(ujatTypedDate([2027, 3, 19, 24, 0])).toBeNull()
  })

  it('parseStoredUjatTypedDetail 은 배열 날짜를 typed-detail GET 과 같은 문자열로 맞춘다', () => {
    const typed = parseStoredUjatTypedDetail(
      JSON.stringify({ ujatTypedDetail: fixture.ujatTypedDetail })
    )
    const h1Main = typed?.halfPlans?.[0]?.stages?.find(s => s.stage === 'MAIN_EDUCATION')
      ?.rows?.[0]
    expect(h1Main).toMatchObject({
      startDate: '2027-03-19',
      endDate: '2027-06-25',
      dates: [],
      excludedDates: ['2027-03-26', '2027-04-09'],
    })
    const h2Main = typed?.halfPlans?.[1]?.stages?.find(s => s.stage === 'MAIN_EDUCATION')
      ?.rows?.[0]
    expect(h2Main).toMatchObject({ startDate: '2027-09-10', endDate: '2027-11-26' })
  })

  it('fromDetail 이 186383 저장 문서(overlay 동일)를 throw 없이 변환한다', () => {
    const mapped = fromDetail(
      detailDto({
        registration: { overlay: fixture.registrationOverlay },
        ujatTypedDetail: fixture.ujatTypedDetail,
      })
    )
    const overlay = mapped.ujatRegistrationOverlay ?? {}
    expect(overlay[H1_KEYS.range]).toEqual({
      start: '2027-03-18T15:00:00.000Z',
      end: '2027-06-24T15:00:00.000Z',
    })
    expect(overlay[H1_KEYS.unavailable]).toEqual(['2027-03-26', '2027-04-09'])
  })

  it('fromDetail — overlay 반기 키가 없으면 typed 값으로 H1 03-19~06-25, 불가일 03-26·04-09 를 채운다', () => {
    const mapped = fromDetail(
      detailDto({
        registration: { overlay: { 'ujat.basicInfo.repKo': 'x' } },
        ujatTypedDetail: fixture.ujatTypedDetail,
      })
    )
    const overlay = mapped.ujatRegistrationOverlay ?? {}
    // 서울 자정 = 전날 15:00Z → 서울 날짜 03-19 ~ 06-25
    expect(overlay[H1_KEYS.range]).toEqual({
      start: '2027-03-18T15:00:00.000Z',
      end: '2027-06-24T15:00:00.000Z',
    })
    expect(overlay[H1_KEYS.unavailable]).toEqual(['2027-03-26', '2027-04-09'])
    expect(overlay['ujat.h1.event.name']).toBe('상반기 학교 경제교육')
    expect(overlay['ujat.h2.event.range']).toEqual({
      start: '2027-09-09T15:00:00.000Z',
      end: '2027-11-25T15:00:00.000Z',
    })
    expect(overlay['ujat.h2.eduSchedule.exclusion']).toMatchObject({ excludeHoliday: true })
  })

  it('읽을 수 없는 날짜는 throw 하지 않고 해당 값·기간만 버린다', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const garbage = structuredClone(fixture.ujatTypedDetail) as {
      halfPlans: { stages: { stage: string; rows: Record<string, unknown>[] }[] }[]
    }
    const row = garbage.halfPlans[0].stages.find(s => s.stage === 'MAIN_EDUCATION')!.rows[0]
    row.startDate = 'not-a-date'
    row.endDate = [2027, 6, 25]
    row.excludedDates = [[2027, 3, 26], 'garbage', [2027, 2, 31], { y: 1 }, null]
    row.dates = 'nope'
    const serviceDetailJson = JSON.stringify({ ujatTypedDetail: garbage })

    expect(() => fromDetail(detailDto(JSON.parse(serviceDetailJson)))).not.toThrow()
    const overlay = applyStoredUjatTypedHalvesToOverlay(
      {},
      parseStoredUjatTypedDetail(serviceDetailJson)
    )
    expect(overlay[H1_KEYS.range]).toBeUndefined()
    expect(overlay[H1_KEYS.unavailable]).toEqual(['2027-03-26'])
    // H2 는 영향 없음
    expect(overlay['ujat.h2.event.range']).toEqual({
      start: '2027-09-09T15:00:00.000Z',
      end: '2027-11-25T15:00:00.000Z',
    })
  })

  it('apply 경로는 정규화를 거치지 않은 잘못된 날짜가 와도 throw 하지 않는다', () => {
    const overlay = applyStoredUjatTypedHalvesToOverlay(
      {},
      {
        halfPlans: [
          {
            semesterType: 'FIRST_HALF',
            stages: [
              {
                stage: 'MAIN_EDUCATION',
                rows: [
                  {
                    rowId: 'legacy-FIRST_HALF-MAIN_EDUCATION',
                    educationName: 'x',
                    startDate: '2027,3,19',
                    endDate: '2027-06-25',
                    excludedDates: ['bad', '2027-04-09'],
                  },
                ],
              },
            ],
          },
        ],
      }
    )
    expect(overlay[H1_KEYS.range]).toBeUndefined()
    expect(overlay[H1_KEYS.unavailable]).toEqual(['2027-04-09'])
  })
})
