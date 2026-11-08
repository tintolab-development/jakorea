import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { buildGeminiTrainingReportsListQuery } from '../../api/performance-remote/client'
import {
  getGeminiPerformanceDefaultDateRange,
  toGeminiPerformanceRemoteFilters,
  type GeminiPerformanceListUiFilters,
} from './list-remote-filters'

function uiFilters(patch: Partial<GeminiPerformanceListUiFilters> = {}): GeminiPerformanceListUiFilters {
  return {
    instructorName: '',
    trainingMethod: 'ALL',
    trainingLocation: '',
    trainingDateRange: null,
    ...patch,
  }
}

describe('getGeminiPerformanceDefaultDateRange', () => {
  it('Asia/Seoul 기준 올해 1월 1일 ~ 오늘', () => {
    // UTC 2026-12-31 16:00 = KST 2027-01-01 01:00
    const [from, to] = getGeminiPerformanceDefaultDateRange(new Date('2026-12-31T16:00:00Z'))
    expect(from.format('YYYY-MM-DD')).toBe('2027-01-01')
    expect(to.format('YYYY-MM-DD')).toBe('2027-01-01')
  })

  it('연중에는 연초부터 오늘까지', () => {
    const [from, to] = getGeminiPerformanceDefaultDateRange(new Date('2026-11-08T03:00:00Z'))
    expect(from.format('YYYY-MM-DD')).toBe('2026-01-01')
    expect(to.format('YYYY-MM-DD')).toBe('2026-11-08')
  })
})

describe('toGeminiPerformanceRemoteFilters', () => {
  it('기본 연수일을 첫 요청부터 dateFrom/dateTo로 보낸다', () => {
    const range = getGeminiPerformanceDefaultDateRange(new Date('2026-11-08T03:00:00Z'))
    expect(toGeminiPerformanceRemoteFilters(uiFilters({ trainingDateRange: range }))).toEqual({
      instructorName: undefined,
      trainingLocation: undefined,
      dateFrom: '2026-01-01',
      dateTo: '2026-11-08',
      deliveryType: undefined,
    })
  })

  it('연수방식은 deliveryType으로, 전체면 생략한다', () => {
    expect(
      toGeminiPerformanceRemoteFilters(uiFilters({ trainingMethod: 'ONLINE' })).deliveryType
    ).toBe('ONLINE')
    expect(
      toGeminiPerformanceRemoteFilters(uiFilters({ trainingMethod: 'OFFLINE' })).deliveryType
    ).toBe('OFFLINE')
    expect(toGeminiPerformanceRemoteFilters(uiFilters()).deliveryType).toBeUndefined()
  })

  it('강사·연수장소는 앞뒤 공백을 지워 보내고, 날짜 한쪽만 있으면 그쪽만 보낸다', () => {
    expect(
      toGeminiPerformanceRemoteFilters(
        uiFilters({
          instructorName: ' 홍길동 ',
          trainingLocation: ' 서울 ',
          trainingDateRange: [dayjs('2026-03-01'), null],
        })
      )
    ).toEqual({
      instructorName: '홍길동',
      trainingLocation: '서울',
      dateFrom: '2026-03-01',
      dateTo: undefined,
      deliveryType: undefined,
    })
  })
})

describe('buildGeminiTrainingReportsListQuery', () => {
  it('training-reports 지원 쿼리(dateFrom·dateTo·deliveryType)만 싣는다', () => {
    const query = buildGeminiTrainingReportsListQuery({
      ...toGeminiPerformanceRemoteFilters(
        uiFilters({
          instructorName: '홍길동',
          trainingMethod: 'ONLINE',
          trainingDateRange: [dayjs('2026-01-01'), dayjs('2026-11-08')],
        })
      ),
      page: 0,
      size: 20,
    })
    expect(Object.fromEntries(query)).toEqual({
      instructorName: '홍길동',
      dateFrom: '2026-01-01',
      dateTo: '2026-11-08',
      deliveryType: 'ONLINE',
      page: '0',
      size: '20',
    })
    expect(query.has('trainingDateFrom')).toBe(false)
    expect(query.has('trainingMethod')).toBe(false)
  })
})
