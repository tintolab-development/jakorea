import { describe, expect, it } from 'vitest'
import {
  getDisabledGradesForBlock,
} from './ujat-program-application-grade-class-time-paragraph'
import { normalizeUjatApplicationGradeDetailForClassCount } from './ujat-program-application-grade-info-paragraph'
import { buildProgramLinkedScheduleOptions } from './ujat-program-application-preferred-education-schedule-paragraph'
import { ujatEducationScheduleSettingsOverlayKeys } from '@/features/program/ujat/lib/ujat-education-schedule-settings-types'
import { ujatHalfScheduleOverlayKeys } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import type { UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'

describe('UJAT 기관 신청 동적 필드', () => {
  it('학급 수를 줄이면 제거된 반의 번호와 학생 수를 함께 정리한다', () => {
    const normalized = normalizeUjatApplicationGradeDetailForClassCount({
      classCountInput: '2',
      classNoByIndex: { 0: '1', 1: '2', 2: '3' },
      studentCountByIndex: { 0: '25', 1: '24', 2: '23' },
    })

    expect(normalized.classNoByIndex).toEqual({ 0: '1', 1: '2' })
    expect(normalized.studentCountByIndex).toEqual({ 0: '25', 1: '24' })
  })

  it('수업 시간 블록 사이의 학년 중복 선택을 막고 해제 후 다시 허용한다', () => {
    const checked = {
      first: { '1': true, '2': true },
      second: { '1': false },
    }
    expect(getDisabledGradesForBlock('second', checked)).toEqual(new Set(['1', '2']))
    expect(
      getDisabledGradesForBlock('second', {
        first: { '1': false, '2': true },
        second: { '1': false },
      })
    ).toEqual(new Set(['2']))
  })

  it('연동된 상·하반기 행사 기간과 불가일만 진행 희망일 후보로 만든다', () => {
    const h1 = ujatHalfScheduleOverlayKeys('h1')
    const h2 = ujatHalfScheduleOverlayKeys('h2')
    const h1Settings = ujatEducationScheduleSettingsOverlayKeys('h1')
    const h2Settings = ujatEducationScheduleSettingsOverlayKeys('h2')
    const options = buildProgramLinkedScheduleOptions({
      [h1.eventRange]: { start: '2026-04-03T00:00:00.000Z', end: '2026-04-17T00:00:00.000Z' },
      [h2.eventRange]: { start: '2026-09-04T00:00:00.000Z', end: '2026-09-18T00:00:00.000Z' },
      [h1Settings.unavailableDates]: ['2026-04-10'],
      [h2Settings.unavailableDates]: ['2026-09-11'],
    })

    expect(options.map(option => option.id)).toEqual([
      'h1:2026-04-03',
      'h1:2026-04-17',
      'h2:2026-09-04',
      'h2:2026-09-18',
    ])
    expect(options.every(option => option.display.includes('금'))).toBe(true)
    expect(options.map(option => option.display)).toEqual([
      '2026년 4월 3일(금)',
      '2026년 4월 17일(금)',
      '2026년 9월 4일(금)',
      '2026년 9월 18일(금)',
    ])
  })

  it('상·하반기 입력 순서와 무관하게 금요일을 날짜순 한 목록으로 노출한다', () => {
    const h1 = ujatHalfScheduleOverlayKeys('h1')
    const h2 = ujatHalfScheduleOverlayKeys('h2')
    const options = buildProgramLinkedScheduleOptions({
      [h1.eventRange]: { start: '2026-10-02T00:00:00.000Z', end: '2026-10-09T00:00:00.000Z' },
      [h2.eventRange]: { start: '2026-04-03T00:00:00.000Z', end: '2026-04-10T00:00:00.000Z' },
    })
    expect(options.map(option => option.id)).toEqual([
      'h2:2026-04-03',
      'h2:2026-04-10',
      'h1:2026-10-02',
      'h1:2026-10-09',
    ])
  })

  it('연동 기간이 없으면 템플릿 mock 날짜를 대체하지 않는다', () => {
    expect(buildProgramLinkedScheduleOptions({})).toEqual([])
  })

  it('연동 후보 id는 반기 접두를 쓰고 placeholder id와 섞이지 않는다', () => {
    const h1 = ujatHalfScheduleOverlayKeys('h1')
    const options = buildProgramLinkedScheduleOptions({
      [h1.eventRange]: { start: '2026-04-03T00:00:00.000Z', end: '2026-04-03T00:00:00.000Z' },
    })
    expect(options).toEqual([{ id: 'h1:2026-04-03', display: '2026년 4월 3일(금)' }])
  })

  it('저장된 typed MAIN_EDUCATION 구간이 있으면 overlay 반기를 덮지 않는다', () => {
    const h1 = ujatHalfScheduleOverlayKeys('h1')
    const overlay = {
      [h1.eventRange]: { start: '2026-10-02T00:00:00.000Z', end: '2026-10-09T00:00:00.000Z' },
    }
    const typedDetail: UjatTypedDetail = {
      schemaVersion: 1,
      halfPlans: [
        {
          semesterType: 'FIRST_HALF',
          stages: [
            {
              stage: 'MAIN_EDUCATION',
              rows: [
                {
                  startDate: '2026-04-03',
                  endDate: '2026-04-17',
                  excludedDates: ['2026-04-10'],
                },
              ],
            },
          ],
        },
      ],
    }
    expect(buildProgramLinkedScheduleOptions(overlay, typedDetail).map(option => option.id)).toEqual(
      ['h1:2026-04-03', 'h1:2026-04-17']
    )
  })

  it('typed MAIN_EDUCATION 구간이 없으면 위저드 overlay 반기를 쓴다', () => {
    const h1 = ujatHalfScheduleOverlayKeys('h1')
    const overlay = {
      [h1.eventRange]: { start: '2026-04-03T00:00:00.000Z', end: '2026-04-03T00:00:00.000Z' },
    }
    const typedDetail: UjatTypedDetail = { schemaVersion: 1, halfPlans: [] }
    expect(buildProgramLinkedScheduleOptions(overlay, typedDetail)).toEqual([
      { id: 'h1:2026-04-03', display: '2026년 4월 3일(금)' },
    ])
  })
})
