import { describe, expect, it } from 'vitest'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { pruneSelectedSlotIdsToCurrentOptions } from '../src/features/program/lib/portal-confirmed-osa-schedule'
import {
  findIncompleteInstructorAvailableScheduleMessage,
  findIncompleteVolunteerActivityScheduleMessage,
  formatApplyScheduleSummarySegment,
  instructorAvailableScheduleOptionValues,
  instructorAvailableScheduleValuesFromDraftAnswer,
  readRuntimeInstructorScheduleSlots,
  resolveApplyAvailableScheduleSlots,
  resolveScheduleSlotCardLines,
} from '../src/features/program/ui/apply-instructor-available-schedule/apply-instructor-available-schedule'

const instructorKey = PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule

const runtimeParagraph = {
  id: instructorKey,
  runtimeResolved: true,
  optionCount: 2,
  items: [
    { id: 'schedule:187271', label: '1차시 | 09:00 ~ 10:00', startAt: '2026-03-09T00:00:00+09:00' },
    { id: 'schedule:187272', label: '2차시 | 10:00 ~ 11:00', startAt: '2026-03-10T00:00:00+09:00' },
  ],
}

describe('instructor/volunteer available schedule runtime options', () => {
  it('maps BE option ids without rewriting them', () => {
    const mapped = readRuntimeInstructorScheduleSlots(runtimeParagraph)
    expect(mapped?.map(slot => slot.id)).toEqual(['schedule:187271', 'schedule:187272'])
    expect(mapped?.length).toBe(runtimeParagraph.optionCount)
  })

  it('submits selected option ids as a string array', () => {
    const mapped = readRuntimeInstructorScheduleSlots(runtimeParagraph) ?? []
    const selected = instructorAvailableScheduleOptionValues(
      { selectedSlotIds: ['schedule:187271', 'schedule:187272', 'line:0'] },
      mapped,
    )
    expect(selected).toEqual(['schedule:187271', 'schedule:187272'])
  })

  it('restores draft answers from option id arrays', () => {
    expect(
      instructorAvailableScheduleValuesFromDraftAnswer(['schedule:187271', 'schedule:187272']),
    ).toEqual({ selectedSlotIds: ['schedule:187271', 'schedule:187272'] })
  })

  it('drops stale selected ids when options change', () => {
    expect(
      pruneSelectedSlotIdsToCurrentOptions(['schedule:187271', 'stale-id'], [
        'schedule:187271',
        'schedule:187272',
      ]),
    ).toEqual(['schedule:187271'])
  })

  it('does not fabricate display-schedule options when runtime resolved empty', () => {
    const emptyRuntime = readRuntimeInstructorScheduleSlots({
      id: instructorKey,
      runtimeResolved: true,
      items: [],
    })
    expect(emptyRuntime).toEqual([])
    expect(
      resolveApplyAvailableScheduleSlots({
        runtimeSlots: emptyRuntime,
        allowProgramDisplayFallback: false,
        program: { educationScheduleLines: ['표시용 일정'] },
      }),
    ).toEqual([])
  })

  it('shows only the time on individual calendar chips', () => {
    const mapped = readRuntimeInstructorScheduleSlots({
      id: instructorKey,
      runtimeResolved: true,
      items: [
        {
          id: 'schedule:187271',
          label: '26년 10월 24일(토) 16:35 ~ 16:55',
          startAt: '2026-10-24T16:35:00+09:00',
          endAt: '2026-10-24T16:55:00+09:00',
        },
      ],
    })
    expect(resolveScheduleSlotCardLines(mapped![0]!)).toEqual({
      primary: '16:35 ~ 16:55',
    })
    expect(formatApplyScheduleSummarySegment(mapped![0]!)).toBe(
      '2026년 10월 24일(토) 16:35 ~ 16:55',
    )
  })

  it('keeps organization chips as school | region', () => {
    expect(
      resolveScheduleSlotCardLines({
        id: 'schedule:1',
        label: '강서초등학교 | 서울 강서구 | 1차시 | 09:20 ~ 12:00',
        title: '강서초등학교 | 서울 강서구',
        detail: '1차시 | 09:20 ~ 12:00',
        dateKey: '2026-03-09',
      }),
    ).toEqual({
      primary: '강서초등학교 | 서울 강서구',
      secondary: '1차시 | 09:20 ~ 12:00',
    })
  })

  it('blocks submit with explicit empty-option copy', () => {
    expect(findIncompleteInstructorAvailableScheduleMessage({ selectedSlotIds: [] }, [])).toBe(
      '선택 가능한 강의 일정이 없습니다. 관리자에게 문의해 주세요.',
    )
    expect(findIncompleteVolunteerActivityScheduleMessage({ selectedSlotIds: [] }, [])).toBe(
      '선택 가능한 봉사 일정이 없습니다. 관리자에게 문의해 주세요.',
    )
  })
})
