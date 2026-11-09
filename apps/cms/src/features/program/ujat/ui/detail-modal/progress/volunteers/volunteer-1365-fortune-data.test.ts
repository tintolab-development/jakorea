import { describe, expect, it } from 'vitest'
import type { Ujat1365SemesterRegistrationFormResponse } from '@/shared/api/generated/program-progress/schemas/ujat1365SemesterRegistrationFormResponse'
import { resolveVolunteer1365FormErrorMessage } from './use-volunteer-1365-semester-form'
import {
  buildVolunteer1365FortuneSheet,
  buildVolunteer1365SheetModel,
  EMPTY_VOLUNTEER_1365_SHEET_MODEL,
  formatBirthDateFor1365,
  formatVolunteer1365ColumnTitle,
  formatVolunteer1365Minutes,
  getVolunteer1365ColumnWidths,
  toVolunteer1365CellValue,
  VOLUNTEER_1365_HEADER_BG,
  VOLUNTEER_1365_WARN_FG,
} from './volunteer-1365-fortune-data'

/** 백엔드 FE 반영 문서 6장 로컬 QA 예시(programId 186495, SECOND_HALF)와 같은 모양 */
const response: Ujat1365SemesterRegistrationFormResponse = {
  programId: 186495,
  semesterType: 'SECOND_HALF',
  mode: 'PREVIEW',
  columns: {
    openingCeremony: { scheduleId: 187570, date: '2026-08-31', completed: true },
    sessions: [
      { scheduleId: 187580, date: '2026-11-06', completed: true },
      { scheduleId: 187581, date: '2026-11-13', completed: false },
      { scheduleId: 187582, date: '2026-11-20', completed: false },
    ],
  },
  volunteers: [
    {
      participantId: 1,
      memberId: 10,
      name: '김민수',
      birthDate: '1999-03-15',
      external1365Id: 'rhwhddnr11',
      educationRegionCode: 'SEOUL',
      educationRegionName: '서울',
      givenUp: false,
      openingCeremony: { scheduleId: 187570, minutes: 300, status: 'COMPLETED', shortfall: false },
      sessions: [
        { scheduleId: 187580, minutes: 212, status: 'COMPLETED', shortfall: true },
        { scheduleId: 187581, minutes: 0, status: 'ABSENT', shortfall: false },
        { scheduleId: 187582, minutes: null, status: 'NOT_COMPLETED', shortfall: false },
      ],
    },
    {
      participantId: 2,
      memberId: null,
      name: null,
      birthDate: null,
      external1365Id: null,
      educationRegionCode: null,
      educationRegionName: null,
      givenUp: true,
      openingCeremony: null,
      // 순서가 어긋나도 scheduleId로 맞춘다
      sessions: [
        { scheduleId: 187582, minutes: null, status: 'NOT_COMPLETED', shortfall: false },
        { scheduleId: 187580, minutes: 0, status: 'COMPLETED', shortfall: true },
        { scheduleId: 187581, minutes: null, status: 'NOT_COMPLETED', shortfall: false },
      ],
    },
  ],
}

describe('1365 셀 규칙 (cell.status / cell.shortfall만 사용)', () => {
  it('COMPLETED는 인정 분, shortfall이면 warn', () => {
    expect(toVolunteer1365CellValue({ scheduleId: 1, minutes: 300, status: 'COMPLETED', shortfall: false })).toEqual({ text: '5시간', warn: false })
    expect(toVolunteer1365CellValue({ scheduleId: 1, minutes: 212, status: 'COMPLETED', shortfall: true })).toEqual({ text: '3시간 32분', warn: true })
    expect(toVolunteer1365CellValue({ scheduleId: 1, minutes: 0, status: 'COMPLETED', shortfall: true })).toEqual({ text: '0시간', warn: true })
  })

  it('ABSENT는 0시간(빨간색 아님), NOT_COMPLETED·셀 없음은 -', () => {
    expect(toVolunteer1365CellValue({ scheduleId: 1, minutes: 0, status: 'ABSENT', shortfall: false })).toEqual({ text: '0시간' })
    expect(toVolunteer1365CellValue({ scheduleId: 1, minutes: null, status: 'NOT_COMPLETED', shortfall: false })).toEqual({ text: '-' })
    expect(toVolunteer1365CellValue(null)).toEqual({ text: '-' })
  })

  it('표기 형식: 분·날짜·생년월일', () => {
    expect(formatVolunteer1365Minutes(260)).toBe('4시간 20분')
    expect(formatVolunteer1365ColumnTitle('2026-11-06')).toBe('11월 6일')
    expect(formatVolunteer1365ColumnTitle(null)).toBe('-')
    expect(formatBirthDateFor1365('1999-01-11')).toBe('1999.01.11')
  })
})

describe('1365 시트 모델', () => {
  it('헤더는 고정 5열 + columns.sessions 날짜 (BE 열 구성 그대로)', () => {
    expect(buildVolunteer1365SheetModel(response).headerLabels).toEqual([
      '이름',
      '생년월일',
      '1365 ID',
      '지역',
      '발대식',
      '11월 6일',
      '11월 13일',
      '11월 20일',
    ])
  })

  it('행: 원문 1365 ID·지역명, null은 -, BE 순서 유지, scheduleId 매칭', () => {
    const [first, second] = buildVolunteer1365SheetModel(response).rows
    expect(first).toEqual({
      name: '김민수',
      birthDate: '1999.03.15',
      id1365: 'rhwhddnr11',
      region: '서울',
      openingCeremony: { text: '5시간', warn: false },
      sessions: [{ text: '3시간 32분', warn: true }, { text: '0시간' }, { text: '-' }],
    })
    expect(second).toMatchObject({
      name: '-',
      birthDate: '-',
      id1365: '-',
      region: '-',
      openingCeremony: { text: '-' },
      sessions: [{ text: '0시간', warn: true }, { text: '-' }, { text: '-' }],
    })
  })

  it('발대식 일정이 없으면 E열은 유지하고 모두 -', () => {
    const model = buildVolunteer1365SheetModel({
      ...response,
      columns: { openingCeremony: null, sessions: [] },
    })
    expect(model.headerLabels).toEqual(['이름', '생년월일', '1365 ID', '지역', '발대식'])
    expect(model.rows.every(row => row.openingCeremony.text === '-')).toBe(true)
  })

  it('응답이 없으면 헤더만 있는 빈 양식', () => {
    expect(buildVolunteer1365SheetModel(undefined)).toBe(EMPTY_VOLUNTEER_1365_SHEET_MODEL)
  })

  it('시트: 헤더 민트 배경, shortfall 칸만 빨간 굵은 글씨, 피그마 열 폭', () => {
    const sheet = buildVolunteer1365FortuneSheet(buildVolunteer1365SheetModel(response))
    const header = sheet.celldata?.find(cell => cell.r === 0 && cell.c === 0)
    expect(header?.v).toMatchObject({ v: '이름', bg: VOLUNTEER_1365_HEADER_BG, bl: 1 })
    const shortfall = sheet.celldata?.find(cell => cell.r === 1 && cell.c === 5)
    expect(shortfall?.v).toMatchObject({ v: '3시간 32분', fc: VOLUNTEER_1365_WARN_FG, bl: 1 })
    const absent = sheet.celldata?.find(cell => cell.r === 1 && cell.c === 6)
    expect(absent?.v).toMatchObject({ v: '0시간', bl: 0 })
    expect(sheet.config?.columnlen).toEqual({
      0: 140, 1: 140, 2: 160, 3: 120, 4: 120, 5: 120, 6: 120, 7: 120,
    })
  })

  it('긴 값이 있는 열만 피그마 폭보다 넓힌다 (1365 ID 잘림 방지)', () => {
    const longId = 'QA-ROSTER-1365-190002'
    const model = buildVolunteer1365SheetModel({
      ...response,
      volunteers: [{ ...response.volunteers[0]!, external1365Id: longId }],
    })
    const widths = getVolunteer1365ColumnWidths(model)
    expect(widths[2]).toBeGreaterThan(160)
    expect(widths[2]).toBeGreaterThanOrEqual(longId.length * 8 + 24)
    expect(widths.filter((_, index) => index !== 2)).toEqual([140, 140, 120, 120, 120, 120, 120])
  })
})

describe('1365 양식 에러 안내', () => {
  const axiosError = (status: number, code?: string) => ({
    response: { status, data: code ? { error: { code } } : {} },
  })

  it('에러 코드·상태별 문구', () => {
    expect(resolveVolunteer1365FormErrorMessage(axiosError(403))).toContain('권한')
    expect(resolveVolunteer1365FormErrorMessage(axiosError(404, 'UJAT_1365_PROGRAM_NOT_FOUND'))).toContain(
      'UJAT 프로그램'
    )
    expect(resolveVolunteer1365FormErrorMessage(axiosError(400, 'UJAT_1365_SEMESTER_TYPE_INVALID'))).toContain(
      '반기'
    )
    expect(resolveVolunteer1365FormErrorMessage(new Error('network'))).toContain('잠시 후')
  })
})
