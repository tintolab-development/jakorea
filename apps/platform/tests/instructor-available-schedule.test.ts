import { describe, expect, it } from 'vitest'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/gemini-visiting-training-application-form-instructor-draft'
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

  it('maps Gemini preferred schedule candidates without scheduleId', () => {
    const geminiValue = 'gemini-preferred:organization-application:1691500:rank:1'
    const mapped = readRuntimeInstructorScheduleSlots({
      id: GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
      runtimeResolved: true,
      options: [
        {
          option_value: geminiValue,
          option_label: '서울공항초등학교 | 1지망 : 2026. 11. 10(화) | 10:00~12:00(1차시)',
          metadata: {
            source: 'GEMINI_PREFERRED_SCHEDULE',
            organizationApplicationId: 1691500,
            organizationName: '서울공항초등학교',
            preferenceRank: 1,
            date: '2026-11-10',
            startAt: '2026-11-10T01:00:00Z',
            endAt: '2026-11-10T03:00:00Z',
            trainingTimeText: '10:00~12:00(1차시)',
            sessionCount: 1,
          },
        },
        { option_value: 'schedule:186691:organization-application:1691277', option_label: '행사 1' },
      ],
    })
    const slot = mapped![0]!
    expect(slot.id).toBe(geminiValue)
    expect(slot.dateKey).toBe('2026-11-10')
    expect(resolveScheduleSlotCardLines(slot)).toEqual({
      primary: '서울공항초등학교 | 1지망',
      secondary: '1차시 | 10:00 ~ 12:00',
    })
    expect(formatApplyScheduleSummarySegment(slot)).toBe(
      '서울공항초등학교 : 2026년 11월 10일(화) 10:00 ~ 12:00',
    )
    expect(
      instructorAvailableScheduleOptionValues({ selectedSlotIds: [geminiValue] }, mapped!),
    ).toEqual([geminiValue])
    expect(mapped![1]!.id).toBe('schedule:186691:organization-application:1691277')
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
