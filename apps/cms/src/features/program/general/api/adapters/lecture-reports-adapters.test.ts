import { describe, expect, it } from 'vitest'
import {
  buildLectureReportEducationScheduleLabel,
  mapLectureReportDtoToInstructorRow,
} from './lecture-reports-adapters'

describe('buildLectureReportEducationScheduleLabel', () => {
  it('does not use BE dateRoundTimeLabel that marks sessionNo as 차시', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-07',
        sessionNo: 3,
        timeLabel: '22:00-23:00',
        dateRoundTimeLabel: '2026-11-07 · 3차시 · 22:00-23:00',
        lectureLabel: '2026-11-07 · 3차시 · 22:00-23:00',
      })
    ).toBe('2026-11-07 | 3회차 | 22:00-23:00')
  })

  it('shows 회차 and confirmed curriculum 차시 as separate tokens', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-07',
        sessionNo: 3,
        curriculumSessionCount: 2,
        scheduleRole: 'EDUCATION',
        educationSlotKey: 'general-common-line:3',
        timeLabel: '22:00-23:00',
        dateRoundTimeLabel: '2026-11-07 · 3회차 · 2차시 · 22:00-23:00',
      })
    ).toBe('2026-11-07 | 3회차 | 2차시 | 22:00-23:00')
  })

  it('shows 사전교육 from canonical role, not from a missing sessionNo', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-06',
        sessionNo: null,
        scheduleRole: 'PRE_EDUCATION',
        educationSlotKey: 'general-pre-education:1',
        timeLabel: '15:00-15:10',
        dateRoundTimeLabel: '2026-11-06 · 사전교육 · 15:00-15:10',
      })
    ).toBe('2026-11-06 | 사전교육 | 15:00-15:10')
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-06',
        sessionNo: null,
        timeLabel: '15:00-15:10',
      })
    ).toBe('2026-11-06 | 15:00-15:10')
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-06',
        sessionNo: 1,
        scheduleRole: 'CLOSING',
        timeLabel: '15:00-15:10',
      })
    ).toBe('2026-11-06 | 1회차 | 15:00-15:10')
  })

  it('does not invent a missing 차시 or 회차', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-07',
        sessionNo: 3,
        curriculumSessionCount: null,
        timeLabel: '22:00-23:00',
      })
    ).toBe('2026-11-07 | 3회차 | 22:00-23:00')
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-07',
        curriculumSessionCount: 2,
        timeLabel: '22:00-23:00',
        dateRoundTimeLabel: '2026-11-07 · 22:00-23:00',
      })
    ).toBe('2026-11-07 · 22:00-23:00')
  })

  it('uses new-server dateRoundTimeLabel when canonical unit fields are absent', () => {
    expect(
      buildLectureReportEducationScheduleLabel({
        lectureDate: '2026-11-08',
        sessionNo: null,
        curriculumSessionCount: null,
        scheduleRole: null,
        timeLabel: '10:00-11:00',
        dateRoundTimeLabel: '2026-11-08 · 10:00-11:00',
      })
    ).toBe('2026-11-08 · 10:00-11:00')
  })
})

describe('mapLectureReportDtoToInstructorRow', () => {
  it('maps the CMS lecture-report list label from structured fields', () => {
    const row = mapLectureReportDtoToInstructorRow(
      {
        reportId: 11,
        lectureDate: '2026-11-07',
        sessionNo: 3,
        curriculumSessionCount: 1,
        scheduleRole: 'EDUCATION',
        timeLabel: '22:00-23:00',
        dateRoundTimeLabel: '2026-11-07 · 3회차 · 1차시 · 22:00-23:00',
        reportStatus: 'SUBMITTED',
        submittedAt: '2026-11-07T14:00:00Z',
      },
      0
    )
    expect(row?.educationScheduleLabel).toBe('2026-11-07 | 3회차 | 1차시 | 22:00-23:00')
    expect(row?.sessionNo).toBe(3)
    expect(row?.curriculumSessionCount).toBe(1)
  })
})
