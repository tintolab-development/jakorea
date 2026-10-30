import { describe, expect, it } from 'vitest'
import {
  displayOrDash,
  formatAssignmentDistanceKm,
  formatAssignmentScheduleLine,
  mapGeminiLectureSchedulesToAssignmentSources,
} from '../src/features/mypage/education/schedules/lib/instructor-assignment-display'

describe('instructor assignment display', () => {
  it('does not crash when distanceFromHome is a number', () => {
    expect(displayOrDash(23.4)).toBe('23.4')
    expect(formatAssignmentDistanceKm(23.4)).toBe('23.4km')
    expect(formatAssignmentDistanceKm('23.40')).toBe('23.4km')
  })

  it('uses recognizedClassCount for session count', () => {
    const sources = mapGeminiLectureSchedulesToAssignmentSources([
      {
        scheduleId: 9,
        startAt: '2026-11-10T01:00:00.000Z',
        endAt: '2026-11-10T03:00:00.000Z',
        recognizedClassCount: 2,
        sessionNo: 1,
        institutionName: '서울초등학교',
        instructorRole: 'LEAD',
        distanceFromHome: 23.4,
      },
    ])
    expect(sources[0]?.recognizedClassCount).toBe(2)
    expect(formatAssignmentScheduleLine(sources[0]!)).toContain('2차시')
  })

  it('prefers trainingTimeText over ISO clocks', () => {
    expect(
      formatAssignmentScheduleLine({
        assignmentId: 1,
        startAt: '2026-11-10T01:00:00.000Z',
        endAt: '2026-11-10T03:00:00.000Z',
        recognizedClassCount: 2,
        trainingTimeText: '10:00~12:00',
      }),
    ).toContain('10:00~12:00')
  })
})
