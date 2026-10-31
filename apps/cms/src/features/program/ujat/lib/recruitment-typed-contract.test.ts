import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { describe, expect, it } from 'vitest'
import {
  interviewConfigFromLegacyOverlay,
  interviewConfigToLegacyOverlayRecord,
  mapUjatVolunteerTargetsToApi,
  overlayRecordToInterviewConfig,
  parseRecruitmentInterviewConfig,
  typedFieldsFromRecruitmentFormValues,
} from './recruitment-typed-contract'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'

dayjs.extend(utc)
dayjs.extend(timezone)

describe('mapUjatVolunteerTargetsToApi', () => {
  it('기타를 other로 바꾸지 않는다', () => {
    expect(mapUjatVolunteerTargetsToApi(['elementary', '기타', 'other'])).toEqual([
      'elementary',
      '기타',
    ])
  })
})

describe('typedFieldsFromRecruitmentFormValues', () => {
  it('institution kind는 resultAnnouncementDate를 finalPassAnnouncementAt으로 매핑한다', () => {
    const fields = typedFieldsFromRecruitmentFormValues(
      {
        resultAnnouncementDate: '2026-03-16',
        participantRecruitmentAnnouncementPublished: 'published',
        participantRecruitmentNotesNotApplicable: 'applicable',
      } as ProgramDetailEditFormValues,
      'institution'
    )
    expect(fields.finalPassAnnouncementAt).toBe('2026-03-16')
    expect(fields.announcementPublished).toBe(true)
    expect(fields.remarksNotApplicable).toBe(false)
  })

  it('volunteer kind는 finalPassAnnouncementDate를 finalPassAnnouncementAt으로 매핑한다', () => {
    const fields = typedFieldsFromRecruitmentFormValues(
      {
        finalPassAnnouncementDate: '2026-03-23',
        documentPassAnnouncementDate: '2026-03-16',
        volunteerRecruitmentAnnouncementPublished: 'published',
        volunteerRecruitmentNotesNotApplicable: 'applicable',
        volunteerTargets: ['university'],
      } as ProgramDetailEditFormValues,
      'volunteer'
    )
    expect(fields.finalPassAnnouncementAt).toBe('2026-03-23')
    expect(fields.documentPassAnnouncementAt).toBe('2026-03-16')
  })
})

describe('interviewConfig roundtrip', () => {
  it('KST wall-clock 슬롯 키를 변환해도 같은 키로 유지한다', () => {
    const start = dayjs.tz('2026-10-02 09:00', 'Asia/Seoul')
    const end = dayjs.tz('2026-10-02 09:30', 'Asia/Seoul')
    const slotKey = `${start.valueOf()}-${end.valueOf()}`
    const range = [start.toISOString(), end.toISOString()]
    const config = parseRecruitmentInterviewConfig({
      selectedSlotKeys: [slotKey],
      timeUnit: 30,
      interviewTimeRange: range,
      specificUnavailableDates: [],
      appliedUnavailableDates: [],
      exclusionState: { excludeSaturday: false, excludeSunday: true, excludeHoliday: false },
      exceptions: [
        {
          id: '1',
          exceptionDate: start.startOf('day').toISOString(),
          selectedSlotKeys: [slotKey],
        },
      ],
    })
    const ns = 'recruit.volunteer.h1.interview'
    const overlay = interviewConfigToLegacyOverlayRecord(config, ns)
    const restored = overlayRecordToInterviewConfig(overlay, ns)
    expect(restored.selectedSlotKeys).toEqual([slotKey])
    expect(restored.interviewTimeRange).toEqual(range)
    expect(restored.timeUnit).toBe(30)
    expect(restored.exclusionState?.excludeSunday).toBe(true)
    expect(restored.exceptions?.[0]?.selectedSlotKeys).toEqual([slotKey])
    const fromLegacy = interviewConfigFromLegacyOverlay(overlay, ns)
    expect(fromLegacy?.selectedSlotKeys).toEqual([slotKey])
  })

  it('명시적 빈 selectedSlotKeys와 빈 객체를 유지한다', () => {
    expect(parseRecruitmentInterviewConfig({ selectedSlotKeys: [] })?.selectedSlotKeys).toEqual([])
    expect(parseRecruitmentInterviewConfig({})).toEqual({ schemaVersion: 1 })
  })
})
