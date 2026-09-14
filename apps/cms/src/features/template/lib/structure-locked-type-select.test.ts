import { describe, expect, it } from 'vitest'
import { GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/gemini-visiting-training-application-form-institution-draft'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@/features/template/model/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/program-application-form-volunteer-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/ujat-program-application-form-institution-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import { resolveStructureLockedDisplayKind } from '@/features/template/lib/structure-locked-type-select'

describe('resolveStructureLockedDisplayKind', () => {
  it('강사 신청 시드 — 개인정보·제3자·성범죄는 테이블', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord,
        'single_item'
      )
    ).toBe('table')
  })

  it('강사 신청 시드 — 강의 진행 가능 일정은 단일항목', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
        'table'
      )
    ).toBe('single_item')
  })

  it('봉사자 신청 시드 — 개인정보·제3자·이전참여·자유작성은 테이블', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
        'single_item'
      )
    ).toBe('table')
  })

  it('봉사자 신청 시드 — 경험여부·면접·봉사일정은 단일항목', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.jaVolunteerExperience,
        'table'
      )
    ).toBe('single_item')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule,
        'table'
      )
    ).toBe('single_item')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule,
        'table'
      )
    ).toBe('single_item')
  })

  it('기관 신청 시드 — 개인정보·기본정보·안내·성범죄는 테이블', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.guidance,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentSubmissionRequest,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.sexOffenseConsentInquiryMethod,
        'single_item'
      )
    ).toBe('table')
  })

  it('기관 신청 시드 — 진행 희망 교육 일정은 단일항목', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice,
        'table'
      )
    ).toBe('single_item')
  })

  it('참여자 신청 시드 — 개인정보·팀정보는 테이블', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo, 'single_item')
    ).toBe('table')
  })

  it('참여자 신청 시드 — 자기소개·일정은 단일항목', () => {
    expect(
      resolveStructureLockedDisplayKind(PROGRAM_PARTICIPANT_APPLICATION_IDS.selfIntro, 'table')
    ).toBe('single_item')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice,
        'table'
      )
    ).toBe('single_item')
  })

  it('1사1교 기관 신청 시드 — 개인정보·기본·안내·성범죄·희망일정은 테이블', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_ECONOMY_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_ECONOMY_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.basicInfo, 'single_item')
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance, 'single_item')
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentSubmissionRequest,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_ECONOMY_IDS.preferredSchedule,
        'single_item'
      )
    ).toBe('table')
  })

  it('1사1교 기관 신청 시드 — 결연·전년도 경험은 단일항목', () => {
    expect(
      resolveStructureLockedDisplayKind(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.lessonReply, 'table')
    ).toBe('single_item')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_ECONOMY_IDS.educationExperience,
        'table'
      )
    ).toBe('single_item')
  })

  it('Gemini 참여 기관 신청 시드 — 동의·연수·담당·일정은 테이블', () => {
    expect(
      resolveStructureLockedDisplayKind(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.portraitConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.trainingInfo,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.contactPerson,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        GEMINI_VISITING_TRAINING_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
        'single_item'
      )
    ).toBe('table')
  })

  it('UJAT 참여 기관 신청 시드 — 동의·기본·학년은 테이블, 지역·일정·제출확인은 단일항목', () => {
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeApplicationInfo,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.gradeClassTime,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.applicationRegion,
        'table'
      )
    ).toBe('single_item')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.preferredEducationSchedule,
        'table'
      )
    ).toBe('single_item')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.submitConfirmation,
        'table'
      )
    ).toBe('single_item')
  })

  it('UJAT 봉사자 신청 시드 — 동의·기본·기수·자유작성은 테이블, 지역·경험·면접·제출확인은 단일항목', () => {
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.basicInfo,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.preferredRegion,
        'table'
      )
    ).toBe('single_item')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.educationExperience,
        'table'
      )
    ).toBe('single_item')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule,
        'table'
      )
    ).toBe('single_item')
    expect(
      resolveStructureLockedDisplayKind(
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.submitConfirmation,
        'table'
      )
    ).toBe('single_item')
  })

  it('교육받은 교사 참여 기관 신청 시드 — 동의·기본·희망일정은 테이블', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.basicInfo,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule,
        'single_item'
      )
    ).toBe('table')
  })

  it('맵에 없으면 fallback', () => {
    expect(resolveStructureLockedDisplayKind('unknown-paragraph', 'table')).toBe('table')
  })
})
