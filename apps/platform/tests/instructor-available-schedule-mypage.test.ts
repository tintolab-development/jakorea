import { describe, expect, it } from 'vitest'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import {
  instructorAvailableScheduleHasSubmittedSelection,
  readInstructorScheduleBindingSlotsFromFormDocument,
  readSelectedSlotIdsFromAnswers,
  resolveInstructorAvailableScheduleLines,
} from '../src/features/mypage/education/applications/lib/instructor-available-schedule-from-answers'
import { resolveMypagePreferredScheduleLines } from '../src/features/mypage/education/applications/lib/mypage-preferred-schedule-lines'
import { mapPortalProgramApplicationDetail } from '../src/features/mypage/education/applications/api/mappers'

const instructorKey = PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule
const volunteerKey = PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule

const programLookup = {
  educationScheduleLines: [],
  schedules: [
    {
      scheduleLabel: '일정 1',
      name: '프로그램 공통 일정',
      dateLabel: '2026년 4월 20일(월) 09:30 ~ 12:20',
      scheduleId: 186626,
      startAt: '2026-04-20T00:30:00Z',
      endAt: '2026-04-20T03:20:00Z',
    },
  ],
}

const bindingDocument = {
  paragraphs: [
    {
      id: instructorKey,
      runtimeResolved: true,
      items: [
        {
          id: 'schedule:187271:organization-application:9',
          label: '강서초등학교 | 서울 강서구 | 1차시 | 09:30 ~ 12:20',
          startAt: '2026-04-20T09:30:00+09:00',
          endAt: '2026-04-20T12:20:00+09:00',
          organizationName: '강서초등학교',
        },
        {
          id: 'schedule:187272:organization-application:10',
          label: '학사초등학교 | 서울 강서구 | 2차시 | 13:00 ~ 15:00',
          startAt: '2026-04-20T13:00:00+09:00',
          endAt: '2026-04-20T15:00:00+09:00',
          organizationName: '학사초등학교',
        },
      ],
    },
  ],
}

describe('강의현황 신청 내용 — 강의 진행 가능일', () => {
  it('단일 강의 가능 일정을 summary로 표시한다', () => {
    const lines = resolveInstructorAvailableScheduleLines({
      answers: {
        [instructorKey]: {
          summary: '강서초등학교 : 2026년 4월 20일 (09:30 ~ 12:20)',
        },
      },
    })
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('강서초등학교')
    expect(lines[0]).toContain('4월 20일')
  })

  it('여러 강의 가능 일정 순서를 유지한다', () => {
    const lines = resolveInstructorAvailableScheduleLines({
      answers: {
        [instructorKey]: {
          summary:
            '강서초등학교 : 2026년 4월 20일 (09:30 ~ 12:20) | 서울등현초등학교 : 2026년 4월 21일 (10:00 ~ 12:00)',
        },
      },
    })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('강서초등학교')
    expect(lines[1]).toContain('서울등현초등학교')
  })

  it('서로 다른 기관 복수 일정을 selectedLabels로 표시한다', () => {
    const lines = resolveInstructorAvailableScheduleLines({
      answers: {
        [instructorKey]: {
          selectedLabels: [
            '강서초등학교 : 2026년 4월 20일 (09:30 ~ 12:20)',
            '학사초등학교 : 2026년 4월 20일 (13:00 ~ 15:00)',
          ],
        },
      },
    })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('강서초등학교')
    expect(lines[1]).toContain('학사초등학교')
  })

  it('일정 ID만 있는 제출본은 프로그램 일정과 매칭한다', () => {
    const lines = resolveInstructorAvailableScheduleLines({
      answers: { [instructorKey]: ['schedule:186626'] },
      program: programLookup,
    })
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('4월 20일')
  })

  it('숫자 일정 ID 배열을 보존한다', () => {
    expect(readSelectedSlotIdsFromAnswers({ [instructorKey]: [186626] })).toEqual(['186626'])
  })

  it('기관 일정 ID는 form-binding 선택지 라벨로 표시한다', () => {
    const bindingSlots = readInstructorScheduleBindingSlotsFromFormDocument(bindingDocument)
    const lines = resolveInstructorAvailableScheduleLines({
      answers: {
        [instructorKey]: [
          'schedule:187271:organization-application:9',
          'schedule:187272:organization-application:10',
        ],
      },
      bindingSlots,
    })
    expect(lines).toHaveLength(2)
    expect(lines[0]).toContain('강서초등학교')
    expect(lines[1]).toContain('학사초등학교')
  })

  it('결과 대기 상세 answers와 formResponse를 유지한다', () => {
    const mapped = mapPortalProgramApplicationDetail({
      applicationId: 11,
      applicationType: 'INSTRUCTOR',
      programId: 100,
      programTitle: '강사 프로그램',
      displayStatus: '승인대기',
      formResponseId: 501,
      formBindingId: 88,
      formResponseStatus: 'SUBMITTED',
      answers: { [instructorKey]: ['schedule:186626'] },
    })
    expect(mapped?.displayStatus).toBe('waiting_result')
    expect(mapped?.formResponseId).toBe(501)
    expect(mapped?.formBindingId).toBe(88)
    expect(mapped?.preferredScheduleOptionValues).toEqual(['schedule:186626'])
  })

  it('서류 합격 상태에서도 신청 가능 일정을 표시한다', () => {
    const mapped = mapPortalProgramApplicationDetail({
      applicationId: 12,
      applicationType: 'INSTRUCTOR',
      programId: 100,
      programTitle: '강사 프로그램',
      displayStatus: '서류 합격',
      answers: {
        [instructorKey]: {
          selectedLabels: ['강서초등학교 : 2026년 4월 20일 (09:30 ~ 12:20)'],
        },
      },
    })
    expect(mapped?.displayStatus).toBe('document_passed')
    expect(
      resolveInstructorAvailableScheduleLines({ answers: mapped?.applicationAnswers })[0],
    ).toContain('강서초등학교')
  })

  it('일정 미배정 진행 중에도 원본 신청 가능 일정을 유지한다', () => {
    const mapped = mapPortalProgramApplicationDetail({
      applicationId: 13,
      applicationType: 'INSTRUCTOR',
      programId: 100,
      programTitle: '강사 프로그램',
      displayStatus: '진행 중',
      answers: { [instructorKey]: ['schedule:186626'] },
    })
    const lines = resolveInstructorAvailableScheduleLines({
      answers: mapped?.applicationAnswers,
      preferredScheduleOptionValues: mapped?.preferredScheduleOptionValues,
      program: programLookup,
    })
    expect(lines).toHaveLength(1)
  })

  it('실제 신청 내용이 없으면 빈 배열이다', () => {
    expect(
      resolveInstructorAvailableScheduleLines({
        answers: { [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord]: { confirmed: true } },
      }),
    ).toEqual([])
    expect(
      instructorAvailableScheduleHasSubmittedSelection({
        answers: { [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord]: { confirmed: true } },
      }),
    ).toBe(false)
  })

  it('매핑 실패해도 제출 사실은 남긴다', () => {
    expect(
      resolveInstructorAvailableScheduleLines({
        answers: { [instructorKey]: ['schedule:999999:organization-application:1'] },
      }),
    ).toEqual([])
    expect(
      instructorAvailableScheduleHasSubmittedSelection({
        answers: { [instructorKey]: ['schedule:999999:organization-application:1'] },
      }),
    ).toBe(true)
  })

  it('봉사현황 신청 가능 일정 매핑을 회귀하지 않는다', () => {
    const lines = resolveMypagePreferredScheduleLines({
      applicationType: 'VOLUNTEER',
      answers: {
        [volunteerKey]: {
          selectedSlotIds: ['schedule:186626'],
          selectedLabels: ['강서초등학교 : 2026년 4월 20일 (09:30 ~ 12:20)'],
          summary: '강서초등학교 : 2026년 4월 20일 (09:30 ~ 12:20)',
        },
      },
      program: programLookup,
    })
    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('강서초등학교')
  })

  it('일반 교육현황 희망 일정 문구를 회귀하지 않는다', () => {
    expect(
      resolveMypagePreferredScheduleLines({
        applicationType: 'INDIVIDUAL',
        preferredEducationScheduleLabel: '2026년 4월 20일(월) 09:30 ~ 12:20',
      }),
    ).toEqual(['2026년 4월 20일(월) 09:30 ~ 12:20'])
  })
})
