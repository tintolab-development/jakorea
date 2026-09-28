/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  hasIncompleteGeneralProgramRecruitmentRequiredFields,
  type GeneralProgramRecruitmentRequiredFieldContext,
} from './registration-recruitment-required-fields'
import {
  replaceApplicantRecruitInstitutionOverlay,
  resetApplicantRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  replaceGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as K } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'

function ctx(
  patch?: Partial<GeneralProgramRecruitmentRequiredFieldContext>
): GeneralProgramRecruitmentRequiredFieldContext {
  return {
    participant: {
      individual: false,
      organization: true,
      teacherInstructor: false,
      volunteer: false,
    },
    programType: 'schedule',
    sessionRoundType: 'single',
    educationScheduleMode: 'date',
    volunteerExceptionScheduleCount: 0,
    ...patch,
  }
}

const RANGE = { start: '2026-09-01T00:00:00.000Z', end: '2026-09-30T00:00:00.000Z' }

function filledInstitution(): Record<string, unknown> {
  return {
    [K.announcementPublished]: 'published',
    [K.studentListRequired]: 'need',
    [K.preguidanceRequired]: 'need',
    [K.maxAssignableInstructors]: 2,
    [K.maxClassCount]: 4,
    [K.programRangeSeal]: RANGE,
    [K.targetLevels]: ['elementary'],
    [K.targetLevelDetail]: '초등 전학년',
    [K.recruitRangeSeal]: RANGE,
    [K.finalAnnounceIso]: '2026-10-01T00:00:00.000Z',
    [K.finalAnnounceMethod]: '홈페이지 공지',
    [K.inquiryContact]: '담당자',
    [K.inquiryTel]: '010-1234-5678',
    [K.inquiryEmail]: 'a@b.com',
    [K.notesNotApplicable]: true,
    [K.notes]: '',
  }
}

describe('hasIncompleteGeneralProgramRecruitmentRequiredFields', () => {
  beforeEach(() => {
    resetApplicantRecruitInstitutionOverlay()
    resetGeneralRecruitOverlay()
  })

  it('기관 모집 정보가 비면 미완료이다', () => {
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(true)
  })

  it('기관 모집 정보 필수값을 채우면 완료이다', () => {
    replaceApplicantRecruitInstitutionOverlay(filledInstitution())
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(false)
  })

  it('기관 최대 강사 수가 비면 미완료이다', () => {
    const row = filledInstitution()
    delete row[K.maxAssignableInstructors]
    replaceApplicantRecruitInstitutionOverlay(row)
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(true)
  })

  it('비고 해당없음이면 비고 본문 없이도 완료이다', () => {
    replaceApplicantRecruitInstitutionOverlay(filledInstitution())
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(false)
  })

  it('비고 해당없음 해제 시 본문이 필요이다', () => {
    replaceApplicantRecruitInstitutionOverlay({
      ...filledInstitution(),
      [K.notesNotApplicable]: false,
      [K.notes]: '',
    })
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(true)
  })

  it('개인 모집 — 교육 대상·기간·문의 필수', () => {
    replaceGeneralRecruitOverlay({
      'recruit.individual.announcementPublished': 'published',
      'recruit.individual.programRangeSeal': RANGE,
      'recruit.individual.recruitRangeSeal': RANGE,
      'recruit.individual.targetLevels': ['adult'],
      'recruit.individual.targetLevelDetail': '성인',
      'recruit.individual.finalAnnounceIso': '2026-10-01T00:00:00.000Z',
      'recruit.individual.finalAnnounceMethod': '문자',
      'recruit.individual.inquiryContact': '담당',
      'recruit.individual.inquiryTel': '010-0000-0000',
      'recruit.individual.inquiryEmail': 'x@y.com',
      'recruit.individual.notesNotApplicable': true,
    })
    expect(
      hasIncompleteGeneralProgramRecruitmentRequiredFields(
        ctx({
          participant: {
            individual: true,
            organization: false,
            teacherInstructor: false,
            volunteer: false,
          },
        })
      )
    ).toBe(false)
  })

  it('봉사자 면접 있음 — 면접 일정·슬롯 필수', () => {
    replaceGeneralRecruitOverlay({
      'recruit.volunteer.announcementPublished': 'published',
      'recruit.volunteer.interviewRequired': 'yes',
      'recruit.volunteer.programRangeSeal': RANGE,
      'recruit.volunteer.recruitRangeSeal': RANGE,
      'recruit.volunteer.volunteerTargets': ['대학생'],
      'recruit.volunteer.volunteerTargetDetail': '재학생',
      'recruit.volunteer.docDeadlineIso': '2026-09-10T00:00:00.000Z',
      'recruit.volunteer.docAnnounceMethod': '이메일',
      'recruit.volunteer.interviewRangeSeal': RANGE,
      'recruit.volunteer.interviewMethod': '대면',
      'recruit.volunteer.finalAnnounceIso': '2026-10-01T00:00:00.000Z',
      'recruit.volunteer.finalAnnounceMethod': '문자',
      'recruit.volunteer.inquiryContact': '담당',
      'recruit.volunteer.inquiryTel': '010-0000-0000',
      'recruit.volunteer.inquiryEmail': 'x@y.com',
      'recruit.volunteer.notesNotApplicable': true,
      'recruit.volunteer.interview.interviewTimeRange': [
        new Date('2026-09-18T09:00:00'),
        new Date('2026-09-18T12:00:00'),
      ],
      'recruit.volunteer.interview.timeUnit': '30',
      'recruit.volunteer.interview.selectedSlotKeys': ['09:00'],
    })
    expect(
      hasIncompleteGeneralProgramRecruitmentRequiredFields(
        ctx({
          participant: {
            individual: false,
            organization: false,
            teacherInstructor: false,
            volunteer: true,
          },
        })
      )
    ).toBe(false)
  })

  it('봉사자 면접 있음 — 슬롯 미선택이면 미완료이다', () => {
    replaceGeneralRecruitOverlay({
      'recruit.volunteer.announcementPublished': 'published',
      'recruit.volunteer.interviewRequired': 'yes',
      'recruit.volunteer.programRangeSeal': RANGE,
      'recruit.volunteer.recruitRangeSeal': RANGE,
      'recruit.volunteer.volunteerTargets': ['대학생'],
      'recruit.volunteer.volunteerTargetDetail': '재학생',
      'recruit.volunteer.docDeadlineIso': '2026-09-10T00:00:00.000Z',
      'recruit.volunteer.docAnnounceMethod': '이메일',
      'recruit.volunteer.interviewRangeSeal': RANGE,
      'recruit.volunteer.interviewMethod': '대면',
      'recruit.volunteer.finalAnnounceIso': '2026-10-01T00:00:00.000Z',
      'recruit.volunteer.finalAnnounceMethod': '문자',
      'recruit.volunteer.inquiryContact': '담당',
      'recruit.volunteer.inquiryTel': '010-0000-0000',
      'recruit.volunteer.inquiryEmail': 'x@y.com',
      'recruit.volunteer.notesNotApplicable': true,
      'recruit.volunteer.interview.interviewTimeRange': [
        new Date('2026-09-18T09:00:00'),
        new Date('2026-09-18T12:00:00'),
      ],
      'recruit.volunteer.interview.selectedSlotKeys': [],
    })
    expect(
      hasIncompleteGeneralProgramRecruitmentRequiredFields(
        ctx({
          participant: {
            individual: false,
            organization: false,
            teacherInstructor: false,
            volunteer: true,
          },
        })
      )
    ).toBe(true)
  })

  it('봉사자 면접 없음 — 면접 일정 없이 완료이다', () => {
    replaceGeneralRecruitOverlay({
      'recruit.volunteer.announcementPublished': 'published',
      'recruit.volunteer.interviewRequired': 'no',
      'recruit.volunteer.programRangeSeal': RANGE,
      'recruit.volunteer.recruitRangeSeal': RANGE,
      'recruit.volunteer.volunteerTargets': ['대학생'],
      'recruit.volunteer.volunteerTargetDetail': '재학생',
      'recruit.volunteer.finalAnnounceIso': '2026-10-01T00:00:00.000Z',
      'recruit.volunteer.finalAnnounceMethod': '문자',
      'recruit.volunteer.inquiryContact': '담당',
      'recruit.volunteer.inquiryTel': '010-0000-0000',
      'recruit.volunteer.inquiryEmail': 'x@y.com',
      'recruit.volunteer.notesNotApplicable': true,
    })
    expect(
      hasIncompleteGeneralProgramRecruitmentRequiredFields(
        ctx({
          participant: {
            individual: false,
            organization: false,
            teacherInstructor: false,
            volunteer: true,
          },
        })
      )
    ).toBe(false)
  })
})
