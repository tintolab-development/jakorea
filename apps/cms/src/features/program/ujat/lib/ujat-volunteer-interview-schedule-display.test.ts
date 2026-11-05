import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  resolveUjatVolunteerInterviewScheduleDisplay,
  resolveUjatVolunteerInterviewScheduleEditSeed,
} from './ujat-volunteer-interview-schedule-display'

function slotLabel(startMs: number, endMs: number): string {
  return `${dayjs(startMs).format('HH:mm')} ~ ${dayjs(endMs).format('HH:mm')}`
}

function programWithOverlay(overlay: Record<string, unknown>): Program {
  return {
    id: '186030',
    ujatRegistrationOverlay: overlay,
  } as Program
}

describe('resolveUjatVolunteerInterviewScheduleDisplay', () => {
  it('등록 overlay의 하반기 면접 슬롯·불가일을 상세에 표시한다', () => {
    const display = resolveUjatVolunteerInterviewScheduleDisplay(
      programWithOverlay({
        'recruit.volunteer.h2.interview.selectedSlotKeys': [
          '1790743800000-1790744700000',
          '1790744700000-1790745600000',
          '1790745600000-1790746500000',
        ],
        'recruit.volunteer.h2.interview.timeUnit': '15',
        'recruit.volunteer.h2.interview.interviewTimeRange': [
          '2026-09-30T04:50:00.000Z',
          '2026-09-30T05:50:00.000Z',
        ],
        'recruit.volunteer.h2.interview.exclusionState': {
          excludeNone: false,
          excludeSaturday: false,
          excludeSunday: true,
          excludeHoliday: false,
        },
        'recruit.volunteer.h2.interview.appliedUnavailableDates': [],
      }),
      'h2',
      { allowOverlayFallback: true }
    )

    expect(display.common.recurringUnavailable).toBe('일요일')
    expect(display.common.availableTimeSlots).toBe(
      [
        slotLabel(1790743800000, 1790744700000),
        slotLabel(1790744700000, 1790745600000),
        slotLabel(1790745600000, 1790746500000),
      ].join(', ')
    )
  })

  it('예외 일정 블록을 상세에 표시한다', () => {
    const display = resolveUjatVolunteerInterviewScheduleDisplay(
      programWithOverlay({
        'recruit.volunteer.h1.interview.selectedSlotKeys': ['1790743800000-1790744700000'],
        'recruit.volunteer.h1.interview.interviewTimeRange': [
          '2026-09-30T04:50:00.000Z',
          '2026-09-30T05:50:00.000Z',
        ],
        'recruit.volunteer.h1.interview.exception.1710000000001.exceptionDate':
          '2026-10-02T00:00:00.000Z',
        'recruit.volunteer.h1.interview.exception.1710000000001.selectedSlotKeys': [
          '1790743800000-1790744700000',
        ],
      }),
      'h1',
      { allowOverlayFallback: true }
    )

    expect(display.exceptions).toEqual([
      {
        exceptionDate: '2026.10.02(금)',
        availableTimeSlots: slotLabel(1790743800000, 1790744700000),
      },
    ])
  })

  it('원격 프로그램은 overlay가 없으면 mock 대신 빈 표시를 쓴다', () => {
    const display = resolveUjatVolunteerInterviewScheduleDisplay(programWithOverlay({}), 'h1')
    expect(display.common.availableTimeSlots).toBe('-')
    expect(display.common.recurringUnavailable).toBe('-')
  })

  it('typed interviewConfig가 있으면 overlay를 쓰지 않는다', () => {
    const start = 1_790_743_800_000
    const end = 1_790_743_890_000
    const program = {
      id: '186030',
      programRecruitments: [
        {
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF' as const,
          interviewConfig: {
            schemaVersion: 1 as const,
            selectedSlotKeys: [`${start}-${end}`],
            interviewTimeRange: ['2026-09-30T04:50:00.000Z', '2026-09-30T05:50:00.000Z'],
          },
        },
      ],
      ujatRegistrationOverlay: {
        'recruit.volunteer.h1.interview.selectedSlotKeys': ['1-2'],
      },
    } as unknown as Program
    const display = resolveUjatVolunteerInterviewScheduleDisplay(program, 'h1')
    expect(display.common.availableTimeSlots).toBe(slotLabel(start, end))
  })

  it('typed 빈 설정은 overlay를 재주입하지 않는다', () => {
    const program = {
      id: '186030',
      programRecruitments: [
        {
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF' as const,
          interviewConfig: { schemaVersion: 1 as const, selectedSlotKeys: [] },
        },
      ],
      ujatRegistrationOverlay: {
        'recruit.volunteer.h1.interview.selectedSlotKeys': ['1790743800000-1790744700000'],
        'recruit.volunteer.h1.interview.interviewTimeRange': [
          '2026-09-30T04:50:00.000Z',
          '2026-09-30T05:50:00.000Z',
        ],
      },
    } as unknown as Program
    const display = resolveUjatVolunteerInterviewScheduleDisplay(program, 'h1')
    expect(display.common.availableTimeSlots).toBe('-')
  })

  it('활성 상세는 nested volunteerInterviewScheduleInfo로 빈 슬롯을 채우지 않는다', () => {
    const program = {
      id: '186030',
      programRecruitments: [
        {
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'SECOND_HALF' as const,
          interviewConfig: { schemaVersion: 1 as const, selectedSlotKeys: [] },
        },
      ],
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          availableTimeSlots: '10:00 ~ 10:15',
          recurringUnavailable: '일요일',
        },
      },
    } as unknown as Program
    const display = resolveUjatVolunteerInterviewScheduleDisplay(program, 'h2')
    expect(display.common.availableTimeSlots).toBe('-')
    expect(display.common.recurringUnavailable).toBe('-')
  })

  it('typed 컬럼이 없으면 서버 Legacy overlay를 표시한다', () => {
    const overlayProgram = {
      id: '186030',
      programRecruitments: [
        {
          recruitmentType: 'VOLUNTEER',
          recruitTerm: 'FIRST_HALF' as const,
        },
      ],
      ujatRegistrationOverlay: {
        'recruit.volunteer.h1.interview.selectedSlotKeys': ['1790743800000-1790744700000'],
        'recruit.volunteer.h1.interview.interviewTimeRange': [
          '2026-09-30T04:50:00.000Z',
          '2026-09-30T05:50:00.000Z',
        ],
      },
    } as unknown as Program
    const display = resolveUjatVolunteerInterviewScheduleDisplay(overlayProgram, 'h1')
    expect(display.common.availableTimeSlots).not.toBe('-')
  })
})

describe('resolveUjatVolunteerInterviewScheduleEditSeed', () => {
  it('하반기 timeUnit 15를 overlay에서 복원한다', () => {
    const seed = resolveUjatVolunteerInterviewScheduleEditSeed(
      programWithOverlay({
        'recruit.volunteer.h2.interview.selectedSlotKeys': [
          '1790743800000-1790744700000',
          '1790744700000-1790745600000',
        ],
        'recruit.volunteer.h2.interview.timeUnit': '15',
        'recruit.volunteer.h2.interview.interviewTimeRange': [
          '2026-09-30T04:50:00.000Z',
          '2026-09-30T05:50:00.000Z',
        ],
        'recruit.volunteer.h2.interview.exclusionState': {
          excludeNone: false,
          excludeSaturday: false,
          excludeSunday: true,
          excludeHoliday: false,
        },
      }),
      'h2',
      { allowOverlayFallback: true }
    )

    expect(seed?.timeUnit).toBe('15')
    expect(seed?.excludeSunday).toBe(true)
    expect(seed?.selectedTimeSlotLabels).toEqual([
      slotLabel(1790743800000, 1790744700000),
      slotLabel(1790744700000, 1790745600000),
    ])
  })
})
