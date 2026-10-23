import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import {
  applyGeneralRecruitOverlayToProgram,
  GENERAL_RECRUIT_OVERLAY_KEYS,
  resolveGeneralRecruitDetailDisplayProgram,
} from './general-recruit-overlay-to-program'
import { resolveGeneralProgramVolunteerInterviewScheduleDisplay } from './volunteer-interview-schedule-display'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'

function baseProgram(): Program {
  return {
    id: 'general-test-1',
    title: '테스트 프로그램',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '등록 임시 설명',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    applicationStartDate: '2026-01-01T00:00:00.000Z',
    applicationEndDate: '2026-01-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
  } as Program
}

describe('applyGeneralRecruitOverlayToProgram', () => {
  it('maps institution recruit overlay into participant fields (preferOverlay)', () => {
    const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
    const overlay: Record<string, unknown> = {
      [inst.targetLevels]: ['high', 'university'],
      [inst.targetLevelDetail]: '특성화고 3학년',
      [inst.recruitRangeSeal]: {
        start: '2025-12-08T00:00:00+09:00',
        end: '2026-01-16T00:00:00+09:00',
      },
      [inst.inquiryContact]: 'JA Korea',
      [inst.inquiryTel]: '02-6085-6028',
      [inst.inquiryEmail]: 'cc@jakorea.org',
      [inst.notes]: '테스토 비고',
      [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantDescription]: '모집 양식 프로그램 설명',
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    expect(next.targetLevels).toEqual(['high', 'university'])
    expect(next.district).toBe('특성화고 3학년')
    expect(next.applicationStartDate).toBe('2025-12-08T00:00:00+09:00')
    expect(next.applicationEndDate).toBe('2026-01-16T00:00:00+09:00')
    const participantInfo = next.generalCommonInfo?.participantRecruitmentInfo
    expect(participantInfo?.contactOrganizationName).toBe('JA Korea')
    expect(participantInfo?.inquiryTel).toBe('02-6085-6028')
    expect(participantInfo?.inquiryEmail).toBe('cc@jakorea.org')
    expect(participantInfo?.educationTarget).toBe('고등학교, 대학(원)생')
    expect(participantInfo?.educationTargetDetail).toBe('특성화고 3학년')
    expect(participantInfo?.recruitmentPeriodLabel).toContain('2025')
    expect(participantInfo?.programDescription).toBe('모집 양식 프로그램 설명')
    expect(participantInfo?.remarks).toBe('테스토 비고')
    expect(next.remarks).toBe('테스토 비고')
    expect(next.contactPhone).toBe('02-6085-6028')
    expect(next.contactEmail).toBe('cc@jakorea.org')
    expect(next.description).toBe('모집 양식 프로그램 설명')
  })

  it('기관 비고(recruit.notes)가 leftover individual.notes보다 우선한다', () => {
    const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
    const next = applyGeneralRecruitOverlayToProgram(
      baseProgram(),
      {
        [inst.notes]: '테스토 비고',
        [GENERAL_RECRUIT_OVERLAY_KEYS.individual.notes]: '일정은 학교 사정에 따라 조율할 수 있습니다.',
      },
      { preferOverlay: true }
    )

    expect(next.remarks).toBe('테스토 비고')
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('테스토 비고')
  })

  it('짧은 overlay 교육 대상이 프로그램의 복수 대상을 덮지 않는다', () => {
    const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
    const program = {
      ...baseProgram(),
      targetLevels: ['middle', 'university'],
      targetLevel: 'middle',
    } as Program
    const next = applyGeneralRecruitOverlayToProgram(
      program,
      { [inst.targetLevels]: ['middle'] },
      { preferOverlay: true }
    )
    expect(next.targetLevels).toEqual(['middle', 'university'])
  })

  it('maps trainedTeachers detailInfo thumb and attachments into program', () => {
    const overlay: Record<string, unknown> = {
      'trainedTeachersRecruit.detailInfo.thumbContentUrl': '/api/admin/files/55/content',
      'trainedTeachersRecruit.detailInfo.attachmentFileNames': [
        'TCH-05_운영안내.pdf',
        'TCH-05_교재활용가이드.pdf',
      ],
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    expect(next.keyVisualImage).toBe('/api/admin/files/55/content')
    expect(next.posterImage).toBe('/api/admin/files/55/content')
    expect(next.attachmentFileNames).toEqual([
      'TCH-05_운영안내.pdf',
      'TCH-05_교재활용가이드.pdf',
    ])
  })

  it('maps instructor and volunteer recruit overlays', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const overlay: Record<string, unknown> = {
      [keys.instructor.recruitTargets]: ['adult'],
      [keys.instructor.recruitTargetDetail]: '현직 멘토',
      [keys.instructor.recruitRangeSeal]: {
        start: '2026-02-01T00:00:00+09:00',
        end: '2026-02-28T00:00:00+09:00',
      },
      [keys.instructor.inquiryContact]: '강사 문의처',
      [keys.instructor.inquiryTel]: '010-1111-2222',
      [keys.volunteer.volunteerTargets]: ['university'],
      [keys.volunteer.volunteerTargetDetail]: '봉사 가능자',
      [keys.volunteer.recruitRangeSeal]: {
        start: '2026-03-01T00:00:00+09:00',
        end: '2026-03-15T00:00:00+09:00',
      },
      [keys.volunteer.inquiryContact]: '봉사자 문의처',
      [keys.detailInfo.instructorDescription]: '강사 모집 설명',
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    expect(next.instructorTargets).toEqual(['adult'])
    expect(next.instructorTargetDetail).toBe('현직 멘토')
    expect(next.instructorApplicationStartDate).toBe('2026-02-01T00:00:00+09:00')
    expect(next.instructorApplicationEndDate).toBe('2026-02-28T00:00:00+09:00')
    const instructorInfo = next.generalCommonInfo?.instructorRecruitmentInfo
    expect(instructorInfo?.contactOrganizationName).toBe('강사 문의처')
    expect(instructorInfo?.inquiryTel).toBe('010-1111-2222')
    expect(instructorInfo?.recruitmentTarget).toBe('성인')
    expect(instructorInfo?.recruitmentTargetDetail).toBe('현직 멘토')
    expect(instructorInfo?.programDescription).toBe('강사 모집 설명')
    expect(next.volunteerTargets).toEqual(['university'])
    expect(next.volunteerTargetDetail).toBe('봉사 가능자')
    expect(next.volunteerApplicationStartDate).toBe('2026-03-01T00:00:00+09:00')
    const volunteerInfo = next.generalCommonInfo?.volunteerRecruitmentInfo
    expect(volunteerInfo?.contactOrganizationName).toBe('봉사자 문의처')
    expect(volunteerInfo?.recruitmentTarget).toBe('대학(원)생')
    expect(next.description).toBe('강사 모집 설명')
  })

  it('강사 공고 게시 여부를 overlay에서 강사 모집 정보로 옮긴다', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const unpublished = applyGeneralRecruitOverlayToProgram(
      baseProgram(),
      {
        [keys.instructor.announcementPublished]: 'unpublished',
        [keys.instructor.inquiryContact]: '강사 문의처',
      },
      { preferOverlay: true }
    )
    expect(unpublished.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(
      false
    )
    expect(
      unpublished.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublishedLabel
    ).toBe('미게시')

    const display = resolveGeneralRecruitDetailDisplayProgram(
      {
        ...baseProgram(),
        registrationOverlay: {
          [keys.instructor.announcementPublished]: 'published',
        },
        generalCommonInfo: {
          instructorRecruitmentInfo: {
            contactOrganizationName: '강사 문의처',
            recruitmentPeriodLabel: '2026.10.16(금) ~ 2027.09.15(수)',
          },
        },
      } as Program,
      'instructor'
    )
    expect(display.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished).toBe(true)
    expect(display.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublishedLabel).toBe(
      '게시'
    )
    expect(display.generalCommonInfo?.instructorRecruitmentInfo?.contactOrganizationName).toBe(
      '강사 문의처'
    )
  })

  it('maps individual participant final announce and announcement published from overlay', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const overlay: Record<string, unknown> = {
      [keys.individual.announcementPublished]: 'unpublished',
      [keys.individual.finalAnnounceIso]: '2026-05-01T00:00:00+09:00',
      [keys.individual.finalAnnounceMethod]: '문자 안내',
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    const participantInfo = next.generalCommonInfo?.participantRecruitmentInfo
    expect(participantInfo?.announcementPublished).toBe(false)
    expect(participantInfo?.announcementPublishedLabel).toBe('미게시')
    expect(participantInfo?.finalAnnouncementLabel).toContain('2026')
    expect(participantInfo?.finalAnnouncementLabel).toContain('문자 안내')
    expect(next.resultAnnouncementDate).toBe('2026-05-01T00:00:00+09:00')
    expect(next.resultAnnouncementMethod).toBe('문자 안내')
  })

  it('maps instructor final pass announcement from overlay to nested info and program columns', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const overlay: Record<string, unknown> = {
      [keys.instructor.finalAnnounceIso]: '2026-04-01T00:00:00+09:00',
      [keys.instructor.finalAnnounceMethod]: '홈페이지 공지 및 개별 연락',
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    const instructorInfo = next.generalCommonInfo?.instructorRecruitmentInfo
    expect(instructorInfo?.finalAnnouncementLabel).toContain('2026')
    expect(instructorInfo?.finalAnnouncementLabel).toContain('홈페이지 공지 및 개별 연락')
    expect(next.finalPassAnnouncementDate).toBe('2026-04-01T00:00:00+09:00')
    expect(next.finalPassAnnouncementMethod).toBe('홈페이지 공지 및 개별 연락')
  })

  it('maps volunteer announcement, interview flags, final announce, and interview schedule', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const slotStart = dayjs().startOf('day').hour(9).minute(0).second(0).millisecond(0)
    const slotEnd = slotStart.add(30, 'minute')
    const overlay: Record<string, unknown> = {
      [keys.volunteer.announcementPublished]: 'published',
      [keys.volunteer.interviewRequired]: 'yes',
      [keys.volunteer.docDeadlineIso]: '2026-03-20T00:00:00+09:00',
      [keys.volunteer.docAnnounceMethod]: '이메일',
      [keys.volunteer.interviewRangeSeal]: {
        start: '2026-03-25T00:00:00+09:00',
        end: '2026-03-27T00:00:00+09:00',
      },
      [keys.volunteer.interviewMethod]: '온라인',
      [keys.volunteer.finalAnnounceIso]: '2026-04-01T00:00:00+09:00',
      [keys.volunteer.finalAnnounceMethod]: '홈페이지 공지',
      [keys.volunteer.notesNotApplicable]: true,
      'recruit.volunteer.interview.exclusionState': {
        excludeNone: false,
        excludeSaturday: true,
        excludeSunday: true,
        excludeHoliday: true,
      },
      'recruit.volunteer.interview.appliedUnavailableDates': ['2026-03-26'],
      'recruit.volunteer.interview.selectedSlotKeys': [
        `${slotStart.valueOf()}-${slotEnd.valueOf()}`,
      ],
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    const volunteerInfo = next.generalCommonInfo?.volunteerRecruitmentInfo
    expect(volunteerInfo?.announcementPublished).toBe(true)
    expect(volunteerInfo?.announcementPublishedLabel).toBe('게시')
    expect(volunteerInfo?.volunteerInterviewEnabled).toBe(true)
    expect(volunteerInfo?.generalVolunteerInterviewEnabled).toBe(true)
    expect(volunteerInfo?.volunteerInterviewEnabledLabel).toBe('면접 있음')
    expect(volunteerInfo?.finalAnnouncementLabel).toContain('2026')
    expect(volunteerInfo?.finalAnnouncementLabel).toContain('홈페이지 공지')
    expect(volunteerInfo?.notesNotApplicable).toBe(true)

    expect(next.generalVolunteerInterviewEnabled).toBe(true)
    expect(next.documentPassAnnouncementDate).toBe('2026-03-20T00:00:00+09:00')
    expect(next.documentPassAnnouncementMethod).toBe('이메일')
    expect(next.interviewStartDate).toBe('2026-03-25T00:00:00+09:00')
    expect(next.interviewEndDate).toBe('2026-03-27T00:00:00+09:00')
    expect(next.interviewMethod).toBe('온라인')
    expect(next.finalPassAnnouncementDate).toBe('2026-04-01T00:00:00+09:00')
    expect(next.finalPassAnnouncementMethod).toBe('홈페이지 공지')

    const schedule = next.generalCommonInfo?.volunteerInterviewScheduleInfo
    expect(schedule?.recurringUnavailable).toBe('토요일, 일요일, 공휴일')
    expect(schedule?.specificUnavailableDateIsos).toEqual(['2026-03-26'])
    expect(schedule?.availableTimeSlots).toBe('09:00 ~ 09:30')
  })

  it('keeps nested 불가일 when overlay only has selectedSlotKeys (save preferOverlay)', () => {
    const slotStart = dayjs('2026-03-26T10:00:00')
    const slotEnd = slotStart.add(30, 'minute')
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          recurringUnavailable: '공휴일',
        },
      },
    } as Program
    const overlay = {
      'recruit.volunteer.interview.selectedSlotKeys': [
        `${slotStart.valueOf()}-${slotEnd.valueOf()}`,
      ],
    }

    const next = applyGeneralRecruitOverlayToProgram(program, overlay, { preferOverlay: true })
    const schedule = next.generalCommonInfo?.volunteerInterviewScheduleInfo
    expect(schedule?.recurringUnavailable).toBe('공휴일')
    expect(schedule?.availableTimeSlots).toBe('10:00 ~ 10:30')
  })

  it('formats available time from interviewTimeRange when selectedSlotKeys is empty', () => {
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          recurringUnavailable: '토요일, 일요일, 공휴일',
        },
      },
      registrationOverlay: {
        'recruit.volunteer.interview.selectedSlotKeys': [],
        'recruit.volunteer.interview.interviewTimeRange': [
          '2026-10-11T01:00:00.000Z',
          '2026-10-11T06:00:00.000Z',
        ],
        'recruit.volunteer.interview.timeUnit': '30',
      },
    } as Program

    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
    expect(display.availableTimeSlots).not.toBe('-')
    expect(display.availableTimeSlots.split(', ').length).toBe(10)
  })

  it('prefers selectedSlotKeys over stale nested availableTimeSlots on display', () => {
    const slots = [
      `${dayjs('2026-03-26T10:00:00').valueOf()}-${dayjs('2026-03-26T10:30:00').valueOf()}`,
      `${dayjs('2026-03-26T10:30:00').valueOf()}-${dayjs('2026-03-26T11:00:00').valueOf()}`,
      `${dayjs('2026-03-26T11:00:00').valueOf()}-${dayjs('2026-03-26T11:30:00').valueOf()}`,
      `${dayjs('2026-03-26T11:30:00').valueOf()}-${dayjs('2026-03-26T12:00:00').valueOf()}`,
    ]
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          availableTimeSlots: '10:00 ~ 10:30',
        },
      },
      registrationOverlay: {
        'recruit.volunteer.interview.selectedSlotKeys': slots,
      },
    } as Program

    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
    expect(display.availableTimeSlots.split(', ').length).toBe(4)
    expect(display.availableTimeSlots).toContain('11:30 ~ 12:00')
  })

  it('uses interviewTimeRange when nested has fewer slots than range expansion', () => {
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          availableTimeSlots: '10:00 ~ 10:30',
        },
      },
      registrationOverlay: {
        'recruit.volunteer.interview.selectedSlotKeys': [],
        'recruit.volunteer.interview.interviewTimeRange': [
          '2026-10-11T01:00:00.000Z',
          '2026-10-11T03:00:00.000Z',
        ],
        'recruit.volunteer.interview.timeUnit': '30',
      },
    } as Program

    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
    expect(display.availableTimeSlots.split(', ').length).toBe(4)
  })

  it('shows one slot when selectedSlotKeys has one entry (partial selection SSOT)', () => {
    const slotStart = dayjs('2026-03-26T10:00:00')
    const slotEnd = slotStart.add(30, 'minute')
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
        },
      },
      registrationOverlay: {
        'recruit.volunteer.interview.selectedSlotKeys': [
          `${slotStart.valueOf()}-${slotEnd.valueOf()}`,
        ],
        'recruit.volunteer.interview.interviewTimeRange': [
          '2026-10-11T01:00:00.000Z',
          '2026-10-11T03:00:00.000Z',
        ],
        'recruit.volunteer.interview.timeUnit': '30',
      },
    } as Program

    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
    expect(display.availableTimeSlots).toBe('10:00 ~ 10:30')
  })

  it('shows nested availableTimeSlots when selectedSlotKeys is empty (BE hydrate)', () => {
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          recurringUnavailable: '토요일, 일요일, 공휴일',
          availableTimeSlots: '10:00 ~ 10:30, 10:30 ~ 11:00',
        },
      },
      registrationOverlay: {
        'recruit.volunteer.interview.selectedSlotKeys': [],
        'recruit.volunteer.interview.timeUnit': '30',
      },
    } as Program

    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
    expect(display.availableTimeSlots).toBe('10:00 ~ 10:30, 10:30 ~ 11:00')
  })

  it('merges volunteer interview time slots from overlay when nested JSON only has unavailable dates', () => {
    const slotStart = dayjs('2026-03-26T09:00:00')
    const slotEnd = slotStart.add(30, 'minute')
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        volunteerInterviewScheduleInfo: {
          recurringUnavailable: '토요일, 일요일, 공휴일',
          specificUnavailableDates: '2026.03.26(목)',
          specificUnavailableDateIsos: ['2026-03-26'],
        },
      },
      registrationOverlay: {
        'recruit.volunteer.interview.selectedSlotKeys': [
          `${slotStart.valueOf()}-${slotEnd.valueOf()}`,
        ],
      },
    } as Program

    const display = resolveGeneralProgramVolunteerInterviewScheduleDisplay(program)
    expect(display.recurringUnavailable).toBe('토요일, 일요일, 공휴일')
    expect(display.availableTimeSlots).toBe('09:00 ~ 09:30')
  })

  it('maps volunteer interview exception blocks into the saved schedule', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const exceptionStart = dayjs('2026-03-26T14:00:00')
    const exceptionEnd = exceptionStart.add(30, 'minute')
    const overlay: Record<string, unknown> = {
      [keys.volunteer.interviewRequired]: 'yes',
      'recruit.volunteer.interview.selectedSlotKeys': [
        `${dayjs('2026-03-26T09:00:00').valueOf()}-${dayjs('2026-03-26T09:30:00').valueOf()}`,
      ],
      'recruit.volunteer.interview.exception.1710000000000.exceptionDate':
        '2026-03-26T00:00:00.000Z',
      'recruit.volunteer.interview.exception.1710000000000.selectedSlotKeys': [
        `${exceptionStart.valueOf()}-${exceptionEnd.valueOf()}`,
      ],
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    expect(next.generalCommonInfo?.volunteerInterviewScheduleInfo?.exceptions).toEqual([
      expect.objectContaining({
        blockId: 1710000000000,
        exceptionDateIso: '2026-03-26T00:00:00.000Z',
        availableTimeSlots: '14:00 ~ 14:30',
      }),
    ])
  })

  it('skips volunteer interview schedule when interview is disabled', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const overlay: Record<string, unknown> = {
      [keys.volunteer.announcementPublished]: 'unpublished',
      [keys.volunteer.interviewRequired]: 'no',
      [keys.volunteer.finalAnnounceIso]: '2026-04-01T00:00:00+09:00',
      [keys.volunteer.finalAnnounceMethod]: '문자',
      'recruit.volunteer.interview.selectedSlotKeys': ['1-2'],
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    const volunteerInfo = next.generalCommonInfo?.volunteerRecruitmentInfo
    expect(volunteerInfo?.announcementPublished).toBe(false)
    expect(volunteerInfo?.volunteerInterviewEnabled).toBe(false)
    expect(volunteerInfo?.finalAnnouncementLabel).toContain('문자')
    expect(next.generalVolunteerInterviewEnabled).toBe(false)
    expect(next.generalCommonInfo?.volunteerInterviewScheduleInfo).toBeUndefined()
  })

  it('maps institution recruit settings into participantRecruitmentInfo', () => {
    const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
    const overlay: Record<string, unknown> = {
      [inst.announcementPublished]: 'published',
      [inst.preguidanceRequired]: 'need',
      [inst.studentListRequired]: 'none',
      [inst.maxAssignableInstructors]: 3,
      [inst.maxClassCount]: 4,
      [inst.maxScheduleCount]: 2,
      [inst.maxSessionsPerDay]: 2,
      [inst.finalAnnounceIso]: '2026-04-01T00:00:00+09:00',
      [inst.finalAnnounceMethod]: '홈페이지 공지',
      [inst.notesNotApplicable]: true,
      [inst.recruitRangeSeal]: {
        start: '2026-03-01T00:00:00+09:00',
        end: '2026-03-15T00:00:00+09:00',
      },
      [inst.inquiryContact]: 'JA Korea',
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    const info = next.generalCommonInfo?.participantRecruitmentInfo
    expect(info?.announcementPublished).toBe(true)
    expect(info?.announcementPublishedLabel).toBe('게시')
    expect(info?.preEducationNoticeRequired).toBe(true)
    expect(info?.studentListRequired).toBe('not_required')
    expect(info?.maxAssignableInstructors).toBe(3)
    expect(info?.maxClassCount).toBe(4)
    expect(info?.finalAnnouncementLabel).toContain('홈페이지 공지')
    expect(info?.notesNotApplicable).toBe(true)
    expect(next.studentListRequired).toBe('not_required')
    expect(next.resultAnnouncementMethod).toBe('홈페이지 공지')
  })

  it('maps volunteer doc/interview/final into nested volunteerRecruitmentInfo', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const overlay: Record<string, unknown> = {
      [keys.volunteer.interviewRequired]: 'yes',
      [keys.volunteer.docDeadlineIso]: '2026-03-20T00:00:00+09:00',
      [keys.volunteer.docAnnounceMethod]: '이메일',
      [keys.volunteer.interviewRangeSeal]: {
        start: '2026-03-25T00:00:00+09:00',
        end: '2026-03-27T00:00:00+09:00',
      },
      [keys.volunteer.interviewMethod]: '온라인',
      [keys.volunteer.finalAnnounceIso]: '2026-04-01T00:00:00+09:00',
      [keys.volunteer.finalAnnounceMethod]: '문자',
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: true,
    })

    const info = next.generalCommonInfo?.volunteerRecruitmentInfo
    expect(info?.documentPassAnnouncementDate).toBe('2026-03-20T00:00:00+09:00')
    expect(info?.documentPassAnnouncementMethod).toBe('이메일')
    expect(info?.interviewStartDate).toBe('2026-03-25T00:00:00+09:00')
    expect(info?.interviewEndDate).toBe('2026-03-27T00:00:00+09:00')
    expect(info?.interviewMethod).toBe('온라인')
    expect(info?.finalPassAnnouncementDate).toBe('2026-04-01T00:00:00+09:00')
    expect(info?.finalPassAnnouncementMethod).toBe('문자')
  })

  it('keeps program values when preferOverlay is false and program is filled', () => {
    const overlay: Record<string, unknown> = {
      [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantDescription]: '양식 설명',
      [APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS.inquiryTel]: '02-0000-0000',
    }

    const next = applyGeneralRecruitOverlayToProgram(baseProgram(), overlay, {
      preferOverlay: false,
    })

    expect(next.description).toBe('등록 임시 설명')
  })

  it('returns program unchanged when overlay is empty', () => {
    const program = baseProgram()
    expect(applyGeneralRecruitOverlayToProgram(program, {})).toBe(program)
  })

  it('maps additionalContentHtml into nested + top-level program fields', () => {
    const html = '<p>모집 추가 내용</p>'
    const next = applyGeneralRecruitOverlayToProgram(
      baseProgram(),
      {
        [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantAdditionalHtml]: html,
      },
      { preferOverlay: true }
    )

    expect(next.additionalContentHtml).toBe(html)
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml).toBe(html)
  })

  it('모집 사업 운영 기간은 공통정보 startDate/endDate를 덮지 않는다', () => {
    const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
    const next = applyGeneralRecruitOverlayToProgram(
      {
        ...baseProgram(),
        startDate: '2026-10-13T15:00:00.000Z',
        endDate: '2026-11-07T14:59:59.999Z',
      },
      {
        [inst.programRangeSeal]: {
          start: '2026-10-21T00:00:00+09:00',
          end: '2026-11-01T00:00:00+09:00',
        },
      },
      { preferOverlay: true }
    )

    expect(next.startDate).toBe('2026-10-13T15:00:00.000Z')
    expect(next.endDate).toBe('2026-11-07T14:59:59.999Z')
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.operationPeriodLabel).toContain(
      '2026.10.21'
    )
  })

  it('reads economyRecruit.detailInfo.additionalContentHtml alias', () => {
    const html = '<p>1사1교 추가</p>'
    const next = applyGeneralRecruitOverlayToProgram(
      baseProgram(),
      {
        'economyRecruit.detailInfo.additionalContentHtml': html,
      },
      { preferOverlay: true }
    )

    expect(next.additionalContentHtml).toBe(html)
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.additionalContentHtml).toBe(html)
  })

  it('preferOverlay false면 nested 비고·해당없음을 overlay 옛값으로 덮지 않는다', () => {
    const inst = APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS
    const program = {
      ...baseProgram(),
      generalCommonInfo: {
        participantRecruitmentInfo: {
          remarks: '수정된 비고',
          notesNotApplicable: false,
        },
      },
    } as Program
    const next = applyGeneralRecruitOverlayToProgram(
      program,
      {
        [inst.notesNotApplicable]: true,
        [inst.notes]: 'overlay 옛 비고',
        [GENERAL_RECRUIT_OVERLAY_KEYS.individual.notes]: 'overlay 옛 비고',
        [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.participantOtherNotes]: 'overlay 옛 비고',
      },
      { preferOverlay: false }
    )

    expect(next.generalCommonInfo?.participantRecruitmentInfo?.notesNotApplicable).toBe(false)
    expect(next.generalCommonInfo?.participantRecruitmentInfo?.remarks).toBe('수정된 비고')
  })

  it('강사·봉사자 overlay notes는 비고, detailInfo.otherNotes는 기타사항으로 넣는다', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const next = applyGeneralRecruitOverlayToProgram(
      baseProgram(),
      {
        [keys.instructor.notes]: '신청 전 학교 담당 교사 확인이 필요합니다.',
        [keys.detailInfo.instructorOtherNotes]:
          '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>',
        [keys.volunteer.notes]: '모집 인원 초과 시 선착순으로 마감합니다.',
        [keys.detailInfo.volunteerOtherNotes]:
          '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>',
      },
      { preferOverlay: true }
    )

    const instructorInfo = next.generalCommonInfo?.instructorRecruitmentInfo
    const volunteerInfo = next.generalCommonInfo?.volunteerRecruitmentInfo
    expect(instructorInfo?.remarks).toBe('신청 전 학교 담당 교사 확인이 필요합니다.')
    expect(instructorInfo?.otherMatters).toBe(
      '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>'
    )
    expect(volunteerInfo?.remarks).toBe('모집 인원 초과 시 선착순으로 마감합니다.')
    expect(volunteerInfo?.otherMatters).toBe(
      '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>'
    )
    expect(next.otherNotes).toBeUndefined()
  })

  it('강사 overlay notes는 비고, detailInfo.otherNotes는 기타사항이다', () => {
    const html = '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>'
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const next = applyGeneralRecruitOverlayToProgram(
      {
        ...baseProgram(),
        generalCommonInfo: {
          instructorRecruitmentInfo: { remarks: '신청 전 학교 담당 교사 확인이 필요합니다.' },
        },
      } as Program,
      {
        [keys.instructor.notes]: '신청 전 학교 담당 교사 확인이 필요합니다.',
        [keys.detailInfo.instructorOtherNotes]: html,
      },
      { preferOverlay: false }
    )

    expect(next.generalCommonInfo?.instructorRecruitmentInfo?.remarks).toBe(
      '신청 전 학교 담당 교사 확인이 필요합니다.'
    )
    expect(next.generalCommonInfo?.instructorRecruitmentInfo?.otherMatters).toBe(html)
  })

  it('조회 시 leftover overlay notes가 비어도 강사 비고를 기타사항으로 채우지 않는다', () => {
    const html = '<p>우천·학교 행사와 겹치면 일정을 조정할 수 있습니다.</p>'
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const next = applyGeneralRecruitOverlayToProgram(
      baseProgram(),
      {
        [keys.instructor.notes]: html,
        [keys.detailInfo.instructorOtherNotes]: html,
        [keys.volunteer.notes]: html,
        [keys.detailInfo.volunteerOtherNotes]: '봉사자 기타',
      },
      { preferOverlay: false }
    )

    expect(next.generalCommonInfo?.instructorRecruitmentInfo?.remarks).toBeUndefined()
    expect(next.generalCommonInfo?.instructorRecruitmentInfo?.otherMatters).toBe(html)
    expect(next.generalCommonInfo?.volunteerRecruitmentInfo?.remarks).toBeUndefined()
    expect(next.generalCommonInfo?.volunteerRecruitmentInfo?.otherMatters).toBe('봉사자 기타')
  })
})

describe('resolveGeneralRecruitDetailDisplayProgram', () => {
  it('봉사자 상세 기타사항은 행 otherMatters를 쓰고 비고 overlay를 쓰지 않는다', () => {
    const program = {
      ...baseProgram(),
      otherNotes: '프로그램 공통 기타',
      registrationOverlay: {
        [GENERAL_RECRUIT_OVERLAY_KEYS.detailInfo.volunteerOtherNotes]: 'overlay 비고',
      },
      generalCommonInfo: {
        volunteerRecruitmentInfo: { remarks: '봉사자 비고', otherMatters: 'nested 기타' },
      },
      programRecruitments: [
        {
          id: 186070,
          recruitmentType: 'VOLUNTEER',
          remarks: '행 비고',
          otherMatters: '행 기타사항',
        },
      ],
    } as Program

    const display = resolveGeneralRecruitDetailDisplayProgram(program, 'volunteer')
    expect(display.otherNotes).toBe('행 기타사항')
    expect(display.oneLineIntroduction).toBeUndefined()
  })
})

