import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  kpiCommonInfoFieldsUnchanged,
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
  toKstDateKey,
  wageCommonInfoFieldsUnchanged,
  withVolunteerInterviewSchedulePeriod,
} from './general-program-service-detail-json'

describe('parseGeneralProgramServiceDetailJson registration overlay', () => {
  it('reads registration.overlay only and ignores root registrationOverlay', () => {
    const raw = JSON.stringify({
      schemaVersion: 1,
      generalCommonInfo: {},
      registration: {
        overlay: {
          'recruit.volunteer.interview.selectedSlotKeys': [],
          'recruit.volunteer.interview.timeUnit': '30',
        },
      },
      registrationOverlay: {
        'recruit.volunteer.interviewRequired': 'yes',
        'recruit.volunteer.interview.timeUnit': '60',
      },
    })
    const parsed = parseGeneralProgramServiceDetailJson(raw)
    expect(parsed.registrationOverlay).toEqual({
      'recruit.volunteer.interview.selectedSlotKeys': [],
      'recruit.volunteer.interview.timeUnit': '30',
    })
  })

  it('legacy root-only JSON no longer hydrates overlay (root fallback removed)', () => {
    const parsed = parseGeneralProgramServiceDetailJson(
      JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {},
        registrationOverlay: {
          'generalRegistration.basicInfo.publicProgramTitle': '구버전 공고명',
        },
      })
    )
    expect(parsed.registrationOverlay).toBeUndefined()
  })

  it('null·빈 문자열 serviceDetailJson은 빈 객체다', () => {
    expect(parseGeneralProgramServiceDetailJson(null)).toEqual({})
    expect(parseGeneralProgramServiceDetailJson('')).toEqual({})
    expect(parseGeneralProgramServiceDetailJson('   ')).toEqual({})
  })
})

describe('toKstDateKey', () => {
  it('UTC ISO를 KST 날짜로 바꾼다', () => {
    expect(toKstDateKey('2026-10-31T15:00:00.000Z')).toBe('2026-11-01')
    expect(toKstDateKey('2026-11-01T14:59:59.000Z')).toBe('2026-11-01')
  })

  it('YYYY-MM-DD는 그대로, 빈 값은 undefined', () => {
    expect(toKstDateKey('2026-11-02')).toBe('2026-11-02')
    expect(toKstDateKey('')).toBeUndefined()
    expect(toKstDateKey(undefined)).toBeUndefined()
    expect(toKstDateKey('not-a-date')).toBeUndefined()
  })
})

describe('withVolunteerInterviewSchedulePeriod', () => {
  const schedule = { availableTimeSlots: '10:00 ~ 10:30', recurringUnavailable: '공휴일' }

  it('봉사자 2차 면접 심사 기간을 periodStartDate/periodEndDate로 싣는다', () => {
    const program = {} as Program
    const common = {
      volunteerRecruitmentInfo: {
        interviewStartDate: '2026-10-31T15:00:00.000Z',
        interviewEndDate: '2026-11-01T15:00:00.000Z',
      },
      volunteerInterviewScheduleInfo: schedule,
    } as Program['generalCommonInfo']

    expect(
      withVolunteerInterviewSchedulePeriod(program, common)?.volunteerInterviewScheduleInfo
    ).toEqual({ ...schedule, periodStartDate: '2026-11-01', periodEndDate: '2026-11-02' })
  })

  it('수정 폼에서 바뀐 루트 기간을 우선한다', () => {
    const program = {
      interviewStartDate: '2026-11-04T15:00:00.000Z',
      interviewEndDate: '2026-11-05T15:00:00.000Z',
    } as Program
    const common = {
      volunteerRecruitmentInfo: {
        interviewStartDate: '2026-10-31T15:00:00.000Z',
        interviewEndDate: '2026-11-01T15:00:00.000Z',
      },
      volunteerInterviewScheduleInfo: schedule,
    } as Program['generalCommonInfo']

    expect(
      withVolunteerInterviewSchedulePeriod(program, common)?.volunteerInterviewScheduleInfo
    ).toMatchObject({ periodStartDate: '2026-11-05', periodEndDate: '2026-11-06' })
  })

  it('기간을 비우면 이전 period를 지워 BE가 모집 기간으로 폴백한다', () => {
    const common = {
      volunteerInterviewScheduleInfo: {
        ...schedule,
        periodStartDate: '2026-11-01',
        periodEndDate: '2026-11-02',
      },
    } as Program['generalCommonInfo']

    expect(
      withVolunteerInterviewSchedulePeriod({} as Program, common)?.volunteerInterviewScheduleInfo
    ).toEqual(schedule)
  })

  it('면접 일정 정보가 없으면 건드리지 않는다', () => {
    const common = {
      volunteerRecruitmentInfo: { interviewStartDate: '2026-11-01' },
    } as Program['generalCommonInfo']
    expect(withVolunteerInterviewSchedulePeriod({} as Program, common)).toBe(common)
  })
})

describe('serializeGeneralProgramServiceDetailJson overlayMerge', () => {
  const unitKey = 'generalRegistration.educationCurriculum.unitNameBySession'
  const staleOverlay = { [unitKey]: { 1: '단원1', 2: '단원2', 3: 'stale3', 4: 'stale4' } }
  const twoSessions = [
    { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
    { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '본문2' },
  ]

  function serializeProgram(
    common: NonNullable<Program['generalCommonInfo']>
  ): Program {
    return {
      id: '186234',
      sponsorId: 'sponsor-1',
      title: '대표명',
      mainTitle: '대표명',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      startDate: '2026-04-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      status: 'pending',
      generalProgramAudience: 'organization',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalCommonInfo: common,
      registrationOverlay: staleOverlay,
      rounds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as Program
  }

  function persistOverlay(json: string | undefined): Record<string, unknown> {
    const parsed = JSON.parse(json ?? '{}') as {
      registration?: { overlay?: Record<string, unknown> }
      registrationOverlay?: Record<string, unknown>
    }
    expect(parsed).not.toHaveProperty('registrationOverlay')
    return parsed.registration?.overlay ?? {}
  }

  function unitKeys(json: string | undefined): number[] {
    const record = (persistOverlay(json)[unitKey] ?? {}) as Record<string, unknown>
    return Object.keys(record)
      .filter(key => record[key] != null)
      .map(Number)
      .sort((a, b) => a - b)
  }

  it('기본 legacy-merge 는 nested 생략 시 stale overlay 3·4 를 남긴다', () => {
    const json = serializeGeneralProgramServiceDetailJson(
      serializeProgram({ announcementTitle: '공고' })
    )
    expect(unitKeys(json)).toEqual([1, 2, 3, 4])
  })

  it('nested-ssot 는 nested 2만 미러하고 stale 3·4 를 버린다', () => {
    const json = serializeGeneralProgramServiceDetailJson(
      serializeProgram({ announcementTitle: '공고', curriculumSessions: twoSessions }),
      { overlayMerge: 'nested-ssot' }
    )
    expect(unitKeys(json)).toEqual([1, 2])
  })

  it('nested-ssot + 빈 배열은 unit map 을 비운다', () => {
    const json = serializeGeneralProgramServiceDetailJson(
      serializeProgram({ announcementTitle: '공고', curriculumSessions: [] }),
      { overlayMerge: 'nested-ssot' }
    )
    expect(unitKeys(json)).toEqual([])
  })

  it('nested-ssot omit 은 fallback nested 만 미러하고 JSON 에는 키를 넣지 않는다', () => {
    const json = serializeGeneralProgramServiceDetailJson(
      serializeProgram({ announcementTitle: '공고' }),
      {
        overlayMerge: 'nested-ssot',
        overlayNestedFallback: { curriculumSessions: twoSessions },
      }
    )
    const parsed = JSON.parse(json ?? '{}') as {
      generalCommonInfo?: Record<string, unknown>
    }
    expect(Object.prototype.hasOwnProperty.call(parsed.generalCommonInfo ?? {}, 'curriculumSessions')).toBe(
      false
    )
    expect(unitKeys(json)).toEqual([1, 2])
  })
})

describe('serializeGeneralProgramServiceDetailJson nested-only persist', () => {
  const TITLE_KEY = 'generalRegistration.basicInfo.publicProgramTitle'
  const NOTES_KEY = 'recruit.notes'
  const UNIT_KEY = 'generalRegistration.educationCurriculum.unitNameBySession'
  const WAGE_KEY = 'generalRegistration.wageInfo.paymentItemValues'
  const INTERVIEW_KEY = 'recruit.volunteer.interviewRequired'
  const SLOT_KEY = 'recruit.volunteer.interview.selectedSlotKeys'

  function overlayOf(json: string | undefined) {
    const parsed = JSON.parse(json ?? '{}') as {
      registration?: { overlay?: Record<string, unknown> }
    }
    expect(parsed).not.toHaveProperty('registrationOverlay')
    return parsed.registration?.overlay ?? {}
  }

  function sessionsFromUnitMap(unitMap: unknown) {
    const record = (unitMap ?? {}) as Record<string, unknown>
    return Object.keys(record)
      .map(Number)
      .sort((a, b) => a - b)
      .map(sessionNo => ({
        sessionNo,
        sessionLabel: `${sessionNo}회차`,
        title: String(record[sessionNo] ?? ''),
        description: `본문${sessionNo}`,
      }))
  }

  function programWithOverlay(overlay: Record<string, unknown>, common: Program['generalCommonInfo'] = {}) {
    const notes = typeof overlay[NOTES_KEY] === 'string' ? overlay[NOTES_KEY] : ''
    const title = typeof overlay[TITLE_KEY] === 'string' ? overlay[TITLE_KEY] : ''
    return {
      id: '186359',
      sponsorId: 'sponsor-1',
      title: '대표명',
      mainTitle: '대표명',
      type: 'offline' as const,
      format: 'workshop' as const,
      category: 'school' as const,
      startDate: '2026-04-01T00:00:00.000Z',
      endDate: '2026-12-31T00:00:00.000Z',
      status: 'pending' as const,
      generalProgramAudience: 'organization' as const,
      generalProgramEducationStructure: 'curriculum' as const,
      generalProgramSessionRound: 'multi' as const,
      generalVolunteerInterviewEnabled: true,
      remarks: notes,
      generalCommonInfo: {
        announcementTitle: title,
        participantRecruitmentInfo: { remarks: notes },
        volunteerRecruitmentInfo: { interviewRequired: true },
        volunteerInterviewScheduleInfo: { availableTimeSlots: '10:00 ~ 10:30' },
        curriculumSessions: sessionsFromUnitMap(overlay[UNIT_KEY]),
        paymentItems: Array.isArray(overlay[WAGE_KEY])
          ? (overlay[WAGE_KEY] as string[]).join(',')
          : undefined,
        ...common,
      },
      registrationOverlay: overlay,
      rounds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as Program
  }

  const baselineOverlay = {
    [TITLE_KEY]: '기존 공고명',
    [NOTES_KEY]: '기존 모집 문구',
    [UNIT_KEY]: { 1: '단원1', 2: '단원2' },
    [WAGE_KEY]: ['p-166201', 'p-166204'],
    [INTERVIEW_KEY]: 'yes',
    [SLOT_KEY]: ['slot-a', 'slot-b'],
  }

  it('저장 JSON에 루트 registrationOverlay가 없고 dotted 키를 보존한다', () => {
    const overlay = overlayOf(serializeGeneralProgramServiceDetailJson(programWithOverlay(baselineOverlay)))
    expect(overlay[TITLE_KEY]).toBe('기존 공고명')
    expect(overlay[NOTES_KEY]).toBe('기존 모집 문구')
    expect(overlay[INTERVIEW_KEY]).toBe('yes')
    expect(overlay[SLOT_KEY]).toEqual(['slot-a', 'slot-b'])
  })

  it('모집 문구만 수정해도 교육과정·지급 항목이 남는다', () => {
    const overlay = overlayOf(
      serializeGeneralProgramServiceDetailJson(
        programWithOverlay({ ...baselineOverlay, [NOTES_KEY]: '모집 문구만 수정' })
      )
    )
    expect(overlay[NOTES_KEY]).toBe('모집 문구만 수정')
    expect(overlay[UNIT_KEY]).toEqual({ 1: '단원1', 2: '단원2' })
    expect(overlay[WAGE_KEY]).toEqual(['p-166201', 'p-166204'])
  })

  it('교육과정 한 차시만 수정해도 봉사자 인터뷰 설정이 남는다', () => {
    const overlay = overlayOf(
      serializeGeneralProgramServiceDetailJson(
        programWithOverlay({
          ...baselineOverlay,
          [UNIT_KEY]: { 1: '단원1-수정', 2: '단원2' },
        })
      )
    )
    expect(overlay[UNIT_KEY]).toEqual({ 1: '단원1-수정', 2: '단원2' })
    expect(overlay[INTERVIEW_KEY]).toBe('yes')
    expect(overlay[SLOT_KEY]).toEqual(['slot-a', 'slot-b'])
  })

  it('지급 항목만 수정해도 공고 제목이 남는다', () => {
    const overlay = overlayOf(
      serializeGeneralProgramServiceDetailJson(
        programWithOverlay({ ...baselineOverlay, [WAGE_KEY]: ['p-only'] })
      )
    )
    expect(overlay[WAGE_KEY]).toEqual(['p-only'])
    expect(overlay[TITLE_KEY]).toBe('기존 공고명')
  })

  it('빈 배열 overlay는 조회 시 기본 배열을 발명하지 않는다', () => {
    const parsed = parseGeneralProgramServiceDetailJson(
      JSON.stringify({
        schemaVersion: 1,
        generalCommonInfo: {},
        registration: {
          overlay: {
            [WAGE_KEY]: [],
            [SLOT_KEY]: [],
          },
        },
      })
    )
    expect(parsed.registrationOverlay?.[WAGE_KEY]).toEqual([])
    expect(parsed.registrationOverlay?.[SLOT_KEY]).toEqual([])
  })
})

describe('wageCommonInfoFieldsUnchanged', () => {
  const getRows = [
    { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 140,000원' },
    { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
    { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 100,000원' },
  ]

  it('금액 숫자만 같으면 표기 차이가 있어도 미변경이다', () => {
    expect(
      wageCommonInfoFieldsUnchanged(
        {
          wageGradeRows: [
            { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 140000원' },
            { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
            { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 100,000원' },
          ],
          paymentItems: '강사 교통비',
        },
        { wageGradeRows: getRows, paymentItems: '교통비' }
      )
    ).toBe(true)
  })

  it('강사비가 1원으로 바뀌면 변경이다', () => {
    expect(
      wageCommonInfoFieldsUnchanged(
        {
          wageGradeRows: getRows.map(row => ({
            ...row,
            pricing: '1시간 당 | 기본 : 1원',
          })),
          paymentItems: '교통비',
        },
        { wageGradeRows: getRows, paymentItems: '교통비' }
      )
    ).toBe(false)
  })
})

describe('kpiCommonInfoFieldsUnchanged', () => {
  it('같은 숫자는 미변경이다', () => {
    expect(
      kpiCommonInfoFieldsUnchanged(
        { kpi: { finalParticipants: 40, instructorCount: 3, volunteerCount: 2, finalSchools: 6, finalClasses: 9 } },
        { kpi: { finalParticipants: 40, instructorCount: 3, volunteerCount: 2, finalSchools: 6, finalClasses: 9 } }
      )
    ).toBe(true)
  })
})
