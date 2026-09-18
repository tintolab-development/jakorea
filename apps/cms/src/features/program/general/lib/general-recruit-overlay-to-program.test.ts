import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import {
  applyGeneralRecruitOverlayToProgram,
  GENERAL_RECRUIT_OVERLAY_KEYS,
} from './general-recruit-overlay-to-program'
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
    expect(next.contactPhone).toBe('02-6085-6028')
    expect(next.contactEmail).toBe('cc@jakorea.org')
    expect(next.description).toBe('모집 양식 프로그램 설명')
  })

  it('maps instructor and volunteer recruit overlays', () => {
    const keys = GENERAL_RECRUIT_OVERLAY_KEYS
    const overlay: Record<string, unknown> = {
      [keys.instructor.recruitTargets]: ['성인'],
      [keys.instructor.recruitTargetDetail]: '현직 멘토',
      [keys.instructor.recruitRangeSeal]: {
        start: '2026-02-01T00:00:00+09:00',
        end: '2026-02-28T00:00:00+09:00',
      },
      [keys.instructor.inquiryContact]: '강사 문의처',
      [keys.instructor.inquiryTel]: '010-1111-2222',
      [keys.volunteer.volunteerTargets]: ['대학(원)생'],
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

    expect(next.instructorTargets).toEqual(['성인'])
    expect(next.instructorTargetDetail).toBe('현직 멘토')
    expect(next.instructorApplicationStartDate).toBe('2026-02-01T00:00:00+09:00')
    expect(next.instructorApplicationEndDate).toBe('2026-02-28T00:00:00+09:00')
    const instructorInfo = next.generalCommonInfo?.instructorRecruitmentInfo
    expect(instructorInfo?.contactOrganizationName).toBe('강사 문의처')
    expect(instructorInfo?.inquiryTel).toBe('010-1111-2222')
    expect(instructorInfo?.recruitmentTarget).toBe('성인')
    expect(instructorInfo?.recruitmentTargetDetail).toBe('현직 멘토')
    expect(instructorInfo?.programDescription).toBe('강사 모집 설명')
    expect(next.volunteerTargets).toEqual(['대학(원)생'])
    expect(next.volunteerTargetDetail).toBe('봉사 가능자')
    expect(next.volunteerApplicationStartDate).toBe('2026-03-01T00:00:00+09:00')
    const volunteerInfo = next.generalCommonInfo?.volunteerRecruitmentInfo
    expect(volunteerInfo?.contactOrganizationName).toBe('봉사자 문의처')
    expect(volunteerInfo?.recruitmentTarget).toBe('대학(원)생')
    expect(next.description).toBe('강사 모집 설명')
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
})
