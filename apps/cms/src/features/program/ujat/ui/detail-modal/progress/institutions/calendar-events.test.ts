import { describe, expect, it } from 'vitest'
import {
  buildUjatEducationProgressInstitutionCalendarEvents,
  formatEducationProgressGradeClassDetail,
  toEducationProgressInstitutionCalendarListRow,
} from './calendar-events'
import type { UjatEducationProgressInstitutionRow } from './types'

const EMPTY_GRADES: UjatEducationProgressInstitutionRow['gradeClassCounts'] = {
  '1학년': 0,
  '2학년': 0,
  '3학년': 0,
  '4학년': 0,
  '5학년': 0,
  '6학년': 0,
}

function makeRow(
  overrides: Partial<UjatEducationProgressInstitutionRow> = {}
): UjatEducationProgressInstitutionRow {
  return {
    id: 'inst-1',
    sourceInstitutionId: 'src-1',
    regionKey: 'GYEONGGI_SOUTH' as UjatEducationProgressInstitutionRow['regionKey'],
    no: 1,
    institutionName: '망포초등학교',
    educationRegion: '경기(남부)',
    educationScheduleDisplay: '1월 9일',
    educationScheduleIsoDates: ['2026-01-09'],
    gradeClassCounts: { ...EMPTY_GRADES, '3학년': 2, '5학년': 4 },
    totalEducationClassCount: 6,
    teacherName: '김선생',
    half: 'h1',
    ...overrides,
  }
}

describe('참여 기관 캘린더 우측 카드 (피그마 4082:101452)', () => {
  it('학년별 학급은 학년 순서대로, 0학급 학년은 뺀다', () => {
    expect(
      formatEducationProgressGradeClassDetail({ ...EMPTY_GRADES, '5학년': 4, '3학년': 2 })
    ).toBe('3학년 2학급, 5학년 4학급')
  })

  it('학급이 없으면 빈 문자열', () => {
    expect(formatEducationProgressGradeClassDetail(EMPTY_GRADES)).toBe('')
  })

  it('카드: 제목줄 상태 태그 없이, 2행은 지역 | 학년별 학급', () => {
    const [event] = buildUjatEducationProgressInstitutionCalendarEvents([makeRow()])
    expect(toEducationProgressInstitutionCalendarListRow(event.originalItem)).toMatchObject({
      institutionName: '망포초등학교',
      statusLabel: '',
      totalClassSummary: '경기(남부)',
      gradeDetail: '3학년 2학급, 5학년 4학급',
    })
  })

  it('지역이 비었거나 "-"이면 지역 칸을 비운다', () => {
    const [event] = buildUjatEducationProgressInstitutionCalendarEvents([
      makeRow({ educationRegion: '-' }),
    ])
    expect(event.originalItem.calendarRegionLabel).toBe('')
  })

  it('교육 일정 날짜마다 이벤트를 만든다', () => {
    const events = buildUjatEducationProgressInstitutionCalendarEvents([
      makeRow({ educationScheduleIsoDates: ['2026-01-09', '2026-01-30'] }),
    ])
    expect(events.map(e => e.startDate)).toEqual(['2026-01-09T00:00:00', '2026-01-30T00:00:00'])
  })
})
