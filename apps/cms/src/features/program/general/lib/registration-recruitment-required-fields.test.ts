/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  hasIncompleteGeneralProgramRecruitmentRequiredFields,
  listIncompleteGeneralProgramRecruitmentRequiredFields,
  type GeneralProgramRecruitmentRequiredFieldContext,
} from './registration-recruitment-required-fields'
import {
  replaceApplicantRecruitInstitutionOverlayForScope,
  resetApplicantRecruitInstitutionOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
  setGeneralRecruitOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as K } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  clearRegistrationStepTemplateSelections,
  setRegistrationStepTemplateSelection,
} from '@/features/program/shared/lib/step-template-selection'
import {
  clearOperationalSeedDefaultSuppression,
  suppressOperationalSeedDefaults,
} from '@/features/template/ui/form-set/shared/operational-seed-default-suppression'

const INSTITUTION_CODE = 'recruitment-participant-school'
const INDIVIDUAL_CODE = 'recruitment-participant-individual'
const VOLUNTEER_CODE = 'recruitment-volunteer'

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

function filledIndividual(): Record<string, unknown> {
  return {
    'recruit.individual.announcementPublished': 'published',
    'recruit.individual.interviewRequired': 'no',
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
  }
}

function filledInstructor(): Record<string, unknown> {
  return {
    'recruit.instructor.announcementPublished': 'published',
    'recruit.instructor.programRangeSeal': RANGE,
    'recruit.instructor.recruitRangeSeal': RANGE,
    'recruit.instructor.recruitTargets': ['teacher'],
    'recruit.instructor.recruitTargetDetail': '초등 교사',
    'recruit.instructor.finalAnnounceIso': '2026-10-01T00:00:00.000Z',
    'recruit.instructor.finalAnnounceMethod': '문자',
    'recruit.instructor.inquiryContact': '담당',
    'recruit.instructor.inquiryTel': '010-0000-0000',
    'recruit.instructor.inquiryEmail': 'x@y.com',
    'recruit.instructor.notesNotApplicable': true,
  }
}

function filledVolunteerNoInterview(): Record<string, unknown> {
  return {
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
  }
}

function filledVolunteerWithInterview(slots: unknown[]): Record<string, unknown> {
  return {
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
    'recruit.volunteer.interview.selectedSlotKeys': slots,
  }
}

describe('hasIncompleteGeneralProgramRecruitmentRequiredFields', () => {
  beforeEach(() => {
    resetApplicantRecruitInstitutionOverlayStoreForTests()
    resetGeneralRecruitOverlayStoreForTests()
    clearRegistrationStepTemplateSelections()
  })

  afterEach(() => {
    clearRegistrationStepTemplateSelections()
    resetApplicantRecruitInstitutionOverlayStoreForTests()
    resetGeneralRecruitOverlayStoreForTests()
  })

  it('기관 모집 정보가 비면 미완료이다', () => {
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(true)
  })

  it('기관 모집 정보 필수값을 채우면 완료이다', () => {
    replaceApplicantRecruitInstitutionOverlayForScope(INSTITUTION_CODE, filledInstitution())
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(false)
  })

  it('기관 최대 강사 수가 비면 미완료이다', () => {
    const row = filledInstitution()
    delete row[K.maxAssignableInstructors]
    replaceApplicantRecruitInstitutionOverlayForScope(INSTITUTION_CODE, row)
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(true)
  })

  it('listIncomplete — 기관 최대 강사 수 키를 반환한다', () => {
    const row = filledInstitution()
    delete row[K.maxAssignableInstructors]
    replaceApplicantRecruitInstitutionOverlayForScope(INSTITUTION_CODE, row)
    expect(listIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toContain(
      'recruit.institution.maxAssignableInstructors'
    )
  })

  it('비고 해당없음이면 비고 본문 없이도 완료이다', () => {
    replaceApplicantRecruitInstitutionOverlayForScope(INSTITUTION_CODE, filledInstitution())
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(false)
  })

  it('비고 해당없음 해제 시 본문이 필요이다', () => {
    replaceApplicantRecruitInstitutionOverlayForScope(INSTITUTION_CODE, {
      ...filledInstitution(),
      [K.notesNotApplicable]: false,
      [K.notes]: '',
    })
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(true)
  })

  it('개인 모집 — 교육 대상·기간·문의 필수', () => {
    replaceGeneralRecruitOverlayForScope(INDIVIDUAL_CODE, filledIndividual())
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

  it('개인 모집 — 면접 유무 라디오 미조작(기본 면접 있음)이면 interviewRequired 로 막지 않는다', () => {
    const row = filledIndividual()
    delete row['recruit.individual.interviewRequired']
    replaceGeneralRecruitOverlayForScope(INDIVIDUAL_CODE, {
      ...row,
      'recruit.individual.docDeadlineIso': '2026-09-10T00:00:00.000Z',
      'recruit.individual.docAnnounceMethod': '문자',
      'recruit.individual.interviewRangeSeal': RANGE,
      'recruit.individual.interviewMethod': '대면',
    })
    const keys = listIncompleteGeneralProgramRecruitmentRequiredFields(
      ctx({
        participant: { individual: true, organization: false, teacherInstructor: false, volunteer: false },
      })
    )
    expect(keys).not.toContain('recruit.individual.interviewRequired')
    expect(keys).toEqual([])
  })

  it('개인 모집 — 면접 유무 미조작이면 기본 면접 있음이라 면접 일정은 필수', () => {
    const row = filledIndividual()
    delete row['recruit.individual.interviewRequired']
    replaceGeneralRecruitOverlayForScope(INDIVIDUAL_CODE, row)
    const keys = listIncompleteGeneralProgramRecruitmentRequiredFields(
      ctx({
        participant: { individual: true, organization: false, teacherInstructor: false, volunteer: false },
      })
    )
    expect(keys).not.toContain('recruit.individual.interviewRequired')
    expect(keys).toContain('recruit.individual.interviewMethod')
  })

  it('봉사자 모집 — 면접 유무 라디오 미조작(기본 면접 있음) + 일정 입력이면 완료', () => {
    const row = filledVolunteerWithInterview(['09:00'])
    delete row['recruit.volunteer.interviewRequired']
    replaceGeneralRecruitOverlayForScope(VOLUNTEER_CODE, row)
    const keys = listIncompleteGeneralProgramRecruitmentRequiredFields(
      ctx({
        participant: { individual: false, organization: false, teacherInstructor: false, volunteer: true },
      })
    )
    expect(keys).toEqual([])
  })

  it('봉사자 모집 — 면접 유무 미조작이면 기본 면접 있음이라 면접 일정은 필수', () => {
    const row = filledVolunteerNoInterview()
    delete row['recruit.volunteer.interviewRequired']
    replaceGeneralRecruitOverlayForScope(VOLUNTEER_CODE, row)
    const keys = listIncompleteGeneralProgramRecruitmentRequiredFields(
      ctx({
        participant: { individual: false, organization: false, teacherInstructor: false, volunteer: true },
      })
    )
    expect(keys).not.toContain('recruit.volunteer.interviewRequired')
    expect(keys).toContain('recruit.volunteer.interviewMethod')
  })

  it('봉사자 모집 — 면접 없음이면 면접 일정 없이 완료', () => {
    replaceGeneralRecruitOverlayForScope(VOLUNTEER_CODE, filledVolunteerNoInterview())
    const keys = listIncompleteGeneralProgramRecruitmentRequiredFields(
      ctx({
        participant: { individual: false, organization: false, teacherInstructor: false, volunteer: true },
      })
    )
    expect(keys).toEqual([])
  })

  it('봉사자 면접 있음 — 면접 일정·슬롯 필수', () => {
    replaceGeneralRecruitOverlayForScope(VOLUNTEER_CODE, filledVolunteerWithInterview(['09:00']))
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
    replaceGeneralRecruitOverlayForScope(VOLUNTEER_CODE, filledVolunteerWithInterview([]))
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
    replaceGeneralRecruitOverlayForScope(VOLUNTEER_CODE, filledVolunteerNoInterview())
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

  it('선택된 기관·강사 버킷을 peek하므로 봉사자 탭이 활성 스코프여도 완료이다', () => {
    const institutionCopy = 'recruitment-participant-school-custom-2'
    const instructorCopy = 'recruitment-instructor-custom-2'
    const volunteerCopy = 'recruitment-volunteer-custom-2'
    setRegistrationStepTemplateSelection('GENERAL', 'recruit-participant-school', institutionCopy)
    setRegistrationStepTemplateSelection('GENERAL', 'recruit-instructor', instructorCopy)
    setRegistrationStepTemplateSelection('GENERAL', 'recruit-volunteer', volunteerCopy)
    replaceApplicantRecruitInstitutionOverlayForScope(institutionCopy, filledInstitution())
    replaceGeneralRecruitOverlayForScope(instructorCopy, filledInstructor())
    replaceGeneralRecruitOverlayForScope(volunteerCopy, {
      ...filledVolunteerNoInterview(),
      ...filledInstructor(),
    })
    setGeneralRecruitOverlayScope(volunteerCopy)

    expect(
      hasIncompleteGeneralProgramRecruitmentRequiredFields(
        ctx({
          participant: {
            individual: false,
            organization: true,
            teacherInstructor: true,
            volunteer: true,
          },
        })
      )
    ).toBe(false)
  })

  it('봉사자 버킷에 강사 키가 있어도 선택된 강사 버킷이 비면 미완료이다', () => {
    const instructorCopy = 'recruitment-instructor-custom-2'
    const volunteerCopy = 'recruitment-volunteer-custom-2'
    setRegistrationStepTemplateSelection('GENERAL', 'recruit-instructor', instructorCopy)
    setRegistrationStepTemplateSelection('GENERAL', 'recruit-volunteer', volunteerCopy)
    replaceGeneralRecruitOverlayForScope(volunteerCopy, {
      ...filledVolunteerNoInterview(),
      ...filledInstructor(),
    })
    setGeneralRecruitOverlayScope(volunteerCopy)

    expect(
      listIncompleteGeneralProgramRecruitmentRequiredFields(
        ctx({
          participant: {
            individual: false,
            organization: false,
            teacherInstructor: true,
            volunteer: true,
          },
        })
      )
    ).toContain('recruit.instructor.programRangeSeal')
  })

  it('게시인데 모집 기간이 비면 미완료이다', () => {
    const row = filledInstitution()
    row[K.recruitRangeSeal] = null
    replaceApplicantRecruitInstitutionOverlayForScope(INSTITUTION_CODE, row)
    expect(
      listIncompleteGeneralProgramRecruitmentRequiredFields(ctx())
    ).toContain('recruit.institution.recruitRangeSeal')
  })

  it('미게시이면 모집 기간·발표일이 비어도 완료이다', () => {
    replaceApplicantRecruitInstitutionOverlayForScope(INSTITUTION_CODE, {
      ...filledInstitution(),
      [K.announcementPublished]: 'unpublished',
      [K.programRangeSeal]: null,
      [K.recruitRangeSeal]: null,
      [K.finalAnnounceIso]: '',
      [K.finalAnnounceMethod]: '',
    })
    expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toBe(false)
  })
})

describe('라디오 화면 기본값 미조작 — 미입력으로 막지 않는다(재발 방지)', () => {
  const allTabs = (patch: Partial<GeneralProgramRecruitmentRequiredFieldContext['participant']>) =>
    ctx({
      participant: {
        individual: false,
        organization: false,
        teacherInstructor: false,
        volunteer: false,
        ...patch,
      },
    })

  beforeEach(() => {
    resetApplicantRecruitInstitutionOverlayStoreForTests()
    resetGeneralRecruitOverlayStoreForTests()
    clearRegistrationStepTemplateSelections()
    clearOperationalSeedDefaultSuppression()
  })

  afterEach(() => {
    clearOperationalSeedDefaultSuppression()
    clearRegistrationStepTemplateSelections()
    resetApplicantRecruitInstitutionOverlayStoreForTests()
    resetGeneralRecruitOverlayStoreForTests()
  })

  it('기관 — 공고 게시·학생 명단·사전 안내 라디오 미조작이면 완료', () => {
    const row = filledInstitution()
    delete row[K.announcementPublished]
    delete row[K.studentListRequired]
    delete row[K.preguidanceRequired]
    replaceApplicantRecruitInstitutionOverlayForScope(INSTITUTION_CODE, row)
    expect(listIncompleteGeneralProgramRecruitmentRequiredFields(ctx())).toEqual([])
  })

  it('개인 — 공고 게시 라디오 미조작이면 완료(스크린샷 케이스)', () => {
    const row = filledIndividual()
    delete row['recruit.individual.announcementPublished']
    replaceGeneralRecruitOverlayForScope(INDIVIDUAL_CODE, row)
    expect(listIncompleteGeneralProgramRecruitmentRequiredFields(allTabs({ individual: true }))).toEqual(
      []
    )
  })

  it('강사 — 공고 게시 라디오 미조작이면 완료', () => {
    const row = filledInstructor()
    delete row['recruit.instructor.announcementPublished']
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', row)
    expect(
      listIncompleteGeneralProgramRecruitmentRequiredFields(allTabs({ teacherInstructor: true }))
    ).toEqual([])
  })

  it('봉사 — 공고 게시 라디오 미조작이면 완료', () => {
    const row = filledVolunteerNoInterview()
    delete row['recruit.volunteer.announcementPublished']
    replaceGeneralRecruitOverlayForScope(VOLUNTEER_CODE, row)
    expect(listIncompleteGeneralProgramRecruitmentRequiredFields(allTabs({ volunteer: true }))).toEqual(
      []
    )
  })

  it('명시적 빈 값(화면 미선택)은 여전히 미입력이다', () => {
    replaceApplicantRecruitInstitutionOverlayForScope(INSTITUTION_CODE, {
      ...filledInstitution(),
      [K.announcementPublished]: '',
      [K.studentListRequired]: '',
    })
    const keys = listIncompleteGeneralProgramRecruitmentRequiredFields(ctx())
    expect(keys).toContain('recruit.institution.announcementPublished')
    expect(keys).toContain('recruit.institution.studentListRequired')
  })

  it('템플릿 변경으로 시드 기본값이 억제된 키(화면도 비어 있음)는 채우지 않는다', () => {
    suppressOperationalSeedDefaults('general-recruit', ['recruit.instructor'])
    const row = filledInstructor()
    delete row['recruit.instructor.announcementPublished']
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', row)
    expect(
      listIncompleteGeneralProgramRecruitmentRequiredFields(allTabs({ teacherInstructor: true }))
    ).toContain('recruit.instructor.announcementPublished')
  })

  it('1사1교 강사 탭(일반 단락) — 공고 게시 미조작이면 완료', () => {
    const row = filledInstructor()
    delete row['recruit.instructor.announcementPublished']
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', row)
    expect(
      listIncompleteGeneralProgramRecruitmentRequiredFields({
        ...allTabs({ teacherInstructor: true }),
        registrationProgramType: 'COMPANY_SCHOOL',
      })
    ).toEqual([])
  })
})
