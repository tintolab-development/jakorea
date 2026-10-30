import { describe, expect, it } from 'vitest'
import {
  resolveApplicationFixedScheduleParagraphDescription,
  resolveApplicationPreferredScheduleParagraphDescription,
} from './application-schedule-paragraph-copy.js'
import {
  buildCurriculumMultiDateFixedScheduleChoiceItems,
  readCurriculumMultiDateFixedScheduleMeta,
  readCurriculumPreferredScheduleDailySessionCountForCopy,
  resolveFixedScheduleLinesToChoiceItems,
  shouldUseCurriculumMultiDateFixedScheduleMatrix,
} from './curriculum-multi-date-fixed-schedule.js'
import {
  shouldShowApplicationPreferredScheduleSessionSelect,
  shouldShowApplicationSchedulePeriodDateOnlyPreferred,
} from './schedule-paragraph-visibility.js'

const MATRIX_VISIBILITY = {
  educationStructure: 'curriculum' as const,
  sessionRound: 'multi' as const,
  educationScheduleMode: 'date' as const,
  educationScheduleLines: [
    '26년 4월 20일(월) 9:30 ~ 12:20',
    '26년 4월 27일(월) 13:00 ~ 15:50',
  ],
}

describe('curriculum multi date fixed schedule matrix', () => {
  it('matrix 변형을 판별한다', () => {
    expect(shouldUseCurriculumMultiDateFixedScheduleMatrix(MATRIX_VISIBILITY)).toBe(true)
    expect(
      shouldUseCurriculumMultiDateFixedScheduleMatrix({
        ...MATRIX_VISIBILITY,
        educationScheduleMode: 'period',
      })
    ).toBe(false)
    expect(
      shouldUseCurriculumMultiDateFixedScheduleMatrix({
        ...MATRIX_VISIBILITY,
        sessionRound: 'single',
      })
    ).toBe(false)
  })

  it('복수 회차 커리큘럼도 일정 줄 1개당 선택지 1개만 만든다', () => {
    const items = buildCurriculumMultiDateFixedScheduleChoiceItems(
      MATRIX_VISIBILITY.educationScheduleLines,
      2
    )
    expect(items).toHaveLength(2)
    expect(items[0]).toEqual({
      id: 'line:0',
      label: '26년 4월 20일(월) 9:30 ~ 12:20',
    })
    expect(items[1]).toEqual({
      id: 'line:1',
      label: '26년 4월 27일(월) 13:00 ~ 15:50',
    })
  })

  it('curriculumSessions에서 회차·차시 메타를 읽는다', () => {
    const meta = readCurriculumMultiDateFixedScheduleMeta({
      curriculumSessions: [
        { sessionLabel: '1회차', title: '2' },
        { sessionLabel: '2회차', title: '3' },
      ],
    })
    expect(meta.educationRoundCount).toBe(2)
    expect(meta.sessionsPerRound).toBe(2)
  })

  it('1회차 title이 N차시 형태면 sessionsPerRound는 1회차 진행 차시 수', () => {
    const meta = readCurriculumMultiDateFixedScheduleMeta({
      curriculumSessions: [
        { sessionLabel: '1회차', title: '2차시' },
        { sessionLabel: '2회차', title: '4차시' },
      ],
    })
    expect(meta.sessionsPerRound).toBe(2)
    const text = resolveApplicationFixedScheduleParagraphDescription({
      ...MATRIX_VISIBILITY,
      curriculumSessions: [
        { sessionLabel: '1회차', title: '2차시' },
        { sessionLabel: '2회차', title: '4차시' },
      ],
    })
    expect(text).toBe(
      '2차시*2회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
    )
  })

  it('회차별 차시 수가 다르면 설명 N차시는 1회차 기준', () => {
    const text = resolveApplicationFixedScheduleParagraphDescription({
      ...MATRIX_VISIBILITY,
      curriculumSessions: [
        { sessionLabel: '1회차', title: '2' },
        { sessionLabel: '2회차', title: '4' },
      ],
    })
    expect(text).toBe(
      '2차시*2회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
    )
  })

  it('설명글 N 치환', () => {
    const text = resolveApplicationFixedScheduleParagraphDescription({
      ...MATRIX_VISIBILITY,
      educationRoundCount: 2,
      sessionsPerRound: 2,
    })
    expect(text).toBe(
      '2차시*2회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
    )
  })

  it('메타 없으면 N placeholder', () => {
    const text = resolveApplicationFixedScheduleParagraphDescription({
      ...MATRIX_VISIBILITY,
    })
    expect(text).toBe(
      'N차시*N회로 구성된 프로그램입니다. 진행 가능한 일정을 모두 선택해 주세요.'
    )
  })

  it('기간 지정 희망 설명 — 단일 회차 N차시는 curriculumChartSessionCount', () => {
    const text = resolveApplicationPreferredScheduleParagraphDescription({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'period',
      curriculumChartSessionCount: 3,
      maxScheduleCount: 4,
    })
    expect(text).toBe(
      '교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, 3차시 운영됩니다. (최대 4개까지 희망 일정 신청이 가능합니다.)'
    )
    expect(
      readCurriculumPreferredScheduleDailySessionCountForCopy({
        sessionRound: 'single',
        curriculumSessions: [
          { sessionLabel: '1차시', title: 'A' },
          { sessionLabel: '2차시', title: 'B' },
        ],
      })
    ).toBe(2)
  })

  it('커리큘럼 기간 지망 — 희망 차시 셀렉은 복수 회차만 (단일은 날짜·시간만)', () => {
    expect(
      shouldShowApplicationPreferredScheduleSessionSelect({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'period',
      })
    ).toBe(false)
    expect(
      shouldShowApplicationPreferredScheduleSessionSelect({
        educationStructure: 'curriculum',
        sessionRound: 'multi',
        educationScheduleMode: 'period',
      })
    ).toBe(true)
    expect(
      shouldShowApplicationPreferredScheduleSessionSelect({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: ['26년 4월 20일(월) 9:30 ~ 12:20', '26년 4월 27일(월)'],
      })
    ).toBe(false)
  })

  it('일정형 단일 기간 지망 — 날짜만 설명', () => {
    expect(
      shouldShowApplicationSchedulePeriodDateOnlyPreferred({
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'period',
      })
    ).toBe(true)
    expect(
      shouldShowApplicationSchedulePeriodDateOnlyPreferred({
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'period',
      })
    ).toBe(false)
    const text = resolveApplicationPreferredScheduleParagraphDescription({
      educationStructure: 'schedule',
      sessionRound: 'single',
      educationScheduleMode: 'period',
      maxScheduleCount: 4,
    })
    expect(text).toBe(
      '교육을 희망하는 날짜를 모두 작성해 주세요. (최대 4개까지 희망 일정 신청이 가능합니다.)'
    )
  })

  it('기간 지정 희망 설명 — 복수 N차시는 모집 희망 차시 상한(maxSessionsPerDay), M은 maxScheduleCount', () => {
    const text = resolveApplicationPreferredScheduleParagraphDescription({
      educationStructure: 'curriculum',
      sessionRound: 'multi',
      educationScheduleMode: 'period',
      sessionsPerRound: 2,
      maxScheduleCount: 4,
      maxSessionsPerDay: 5,
    })
    expect(text).toBe(
      '교육을 희망하는 날짜와 수업 시간을 모두 작성해 주세요. 수업은 1일, 5차시 운영됩니다. (최대 4개까지 희망 일정 신청이 가능합니다.)'
    )
    const withoutLimit = resolveApplicationPreferredScheduleParagraphDescription({
      educationStructure: 'curriculum',
      sessionRound: 'multi',
      educationScheduleMode: 'period',
      sessionsPerRound: 2,
      maxScheduleCount: 4,
    })
    expect(withoutLimit).toContain('수업은 1일, N차시 운영됩니다.')
  })

  it('resolveFixedScheduleLinesToChoiceItems — 커리큘럼 복수 날짜는 라인 + 입력순 회차', () => {
    const single = resolveFixedScheduleLinesToChoiceItems(
      { ...MATRIX_VISIBILITY, sessionRound: 'single' },
      MATRIX_VISIBILITY.educationScheduleLines,
      { educationRoundCount: 2 }
    )
    expect(single).toHaveLength(2)
    const matrix = resolveFixedScheduleLinesToChoiceItems(
      MATRIX_VISIBILITY,
      MATRIX_VISIBILITY.educationScheduleLines,
      { educationRoundCount: 2 }
    )
    expect(matrix).toHaveLength(2)
    expect(matrix).toEqual([
      { id: 'line:0', label: '26년 4월 20일(월) 9:30 ~ 12:20 | 1회차' },
      { id: 'line:1', label: '26년 4월 27일(월) 13:00 ~ 15:50 | 2회차' },
    ])
  })

  it('커리큘럼 단일 날짜 — 모든 줄에 커리큘럼 총 차시', () => {
    const lines = [
      '26년 4월 20일(월) 09:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ]
    const items = resolveFixedScheduleLinesToChoiceItems(
      {
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: lines,
      },
      lines,
      { curriculumChartSessionCount: 2 }
    )
    expect(items).toEqual([
      { id: 'line:0', label: `${lines[0]} | 2차시` },
      { id: 'line:1', label: `${lines[1]} | 2차시` },
    ])
  })

  it('커리큘럼 단일 날짜 — 예정일 줄 수가 차시 수보다 많아도 총 차시로 일괄 표기', () => {
    const lines = [
      '2026.11.11(수) 10:00 ~ 12:00',
      '2026.11.03(화) 18:57 ~ 19:57',
      '2026.11.05(목) 18:57 ~ 19:57',
    ]
    const items = resolveFixedScheduleLinesToChoiceItems(
      {
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: lines,
      },
      lines,
      { curriculumChartSessionCount: 2 }
    )
    expect(items.map(item => item.label)).toEqual(lines.map(line => `${line} | 2차시`))
  })

  it('커리큘럼 단일 날짜 — 차시가 1개면 일시만', () => {
    const lines = [
      '26년 4월 20일(월) 09:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ]
    const items = resolveFixedScheduleLinesToChoiceItems(
      {
        educationStructure: 'curriculum',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: lines,
      },
      lines,
      { curriculumChartSessionCount: 1 }
    )
    expect(items).toEqual([
      { id: 'line:0', label: lines[0] },
      { id: 'line:1', label: lines[1] },
    ])
  })

  it('커리큘럼 단일 날짜 — 고정 일정 안내에 1일 N차시', () => {
    const text = resolveApplicationFixedScheduleParagraphDescription({
      educationStructure: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      educationScheduleLines: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 27일(월) 13:00 ~ 15:50',
      ],
      curriculumChartSessionCount: 2,
    })
    expect(text).toBe('진행 가능한 일정을 모두 선택해 주세요. 수업은 1일, 2차시 운영됩니다.')
    expect(
      resolveApplicationFixedScheduleParagraphDescription({
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'date',
      })
    ).toBe(
      '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
    )
  })

  it('일정형 단일 날짜 — 라벨 원문·line:i (matrix 없음)', () => {
    const lines = [
      '26년 4월 20일(월) 9:30 ~ 12:20',
      '26년 4월 27일(월) 13:00 ~ 15:50',
    ]
    const items = resolveFixedScheduleLinesToChoiceItems(
      {
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: lines,
      },
      lines,
      { educationRoundCount: 2 }
    )
    expect(items).toEqual([
      { id: 'line:0', label: lines[0] },
      { id: 'line:1', label: lines[1] },
    ])
  })

  it('파이프로 이은 날짜 일정은 슬롯 두 개로 나눈다', () => {
    const lines = ['26년 10월 30일(금) 13:30 ~ 15:30 | 26년 10월 30일(금) 09:30 ~ 11:30']
    const items = resolveFixedScheduleLinesToChoiceItems(
      {
        educationStructure: 'schedule',
        sessionRound: 'single',
        educationScheduleMode: 'date',
        educationScheduleLines: lines,
      },
      lines,
      {}
    )
    expect(items).toEqual([
      { id: 'line:0', label: '26년 10월 30일(금) 13:30 ~ 15:30' },
      { id: 'line:1', label: '26년 10월 30일(금) 09:30 ~ 11:30' },
    ])
  })

  it('회차 접미사는 별도 슬롯으로 나누지 않는다', () => {
    const lines = ['26년 4월 20일(월) 9:30 ~ 12:20 | 1회차']
    const items = resolveFixedScheduleLinesToChoiceItems(
      { ...MATRIX_VISIBILITY, sessionRound: 'single' },
      lines,
      { educationRoundCount: 2 }
    )
    expect(items).toEqual([{ id: 'line:0', label: lines[0] }])
  })
})
