/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  hasIncompleteEconomyProgramApplicationRequiredFields,
  hasIncompleteEconomyProgramRegistrationRequiredFields,
  hasIncompleteEconomyProgramRecruitmentRequiredFields,
  listIncompleteEconomyProgramRecruitmentRequiredFields,
  listIncompleteEconomyProgramRegistrationRequiredFields,
} from './economy-program-registration-required-fields'
import {
  replaceApplicantRecruitInstitutionOverlayForScope,
  resetApplicantRecruitInstitutionOverlayStoreForTests,
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as RK,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { clearRegistrationStepTemplateSelections } from '@/features/program/shared/lib/step-template-selection'
import {
  replaceGeneralApplicationOverlay,
  resetGeneralApplicationOverlay,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { patchInstitutionSexOffenseConsentSubmissionRequest } from '@/features/program/general/lib/institution-application-form-visibility'

const RANGE = { start: '2026-09-01T00:00:00.000Z', end: '2026-09-30T00:00:00.000Z' }
const ORG = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
} as const

function filledRegistration(): Record<string, unknown> {
  return {
    'economyRegistration.basicInfo.repKo': '1사1교 경제금융교육',
    'economyRegistration.basicInfo.repEn': '1 Company 1 School',
    'economyRegistration.basicInfo.publicProgramTitle': '공고용',
    'economyRegistration.basicInfo.detailedProgramId': '1',
    'economyRegistration.basicInfo.operationRangeSeal': RANGE,
    'economyRegistration.basicInfo.businessField': 'economy_finance',
    'economyRegistration.basicInfo.sponsorId': '__all__',
    'economyRegistration.basicInfo.managerContactId': '__all__',
    'economyRegistration.basicInfo.surveyItems': {
      survey: true,
      satisfaction: true,
      lecture_evaluation: true,
    },
    'economyRegistration.basicInfo.educationCourse': '__all__',
    'economyRegistration.basicInfo.ipOwned': 'ja',
    'economyRegistration.basicInfo.courseDeliveredBy': 'ja',
    'economyRegistration.basicInfo.partnerInvolvement': 'no',
    'economyRegistration.basicInfo.ipsCategory': 'prepare',
    'economyRegistration.kpi.participantCount': 100,
    'economyRegistration.kpi.instructor': 10,
    'economyRegistration.kpi.dispatchedSchool': 5,
    'economyRegistration.kpi.dispatchedClass': 20,
    'economyRegistration.wageInfo.grade1Fee': 100000,
    'economyRegistration.wageInfo.grade1DistanceFee': 10000,
    'economyRegistration.wageInfo.grade2Fee': 80000,
    'economyRegistration.wageInfo.grade2DistanceFee': 8000,
    'economyRegistration.wageInfo.grade3Fee': 60000,
    'economyRegistration.wageInfo.grade3DistanceFee': 6000,
    'economyRegistration.wageInfo.paymentItemValues': ['p-1', 'p-7'],
    'economyRegistration.educationCurriculum.session1.title': '단원1',
    'economyRegistration.educationCurriculum.session1.description': '내용1',
    'economyRegistration.educationCurriculum.session2.title': '단원2',
    'economyRegistration.educationCurriculum.session2.description': '내용2',
    'economyRegistration.educationScheduleSettings.dateRangeSeal': RANGE,
  }
}

describe('economy registration required fields', () => {
  it('빈 overlay면 미완료', () => {
    expect(hasIncompleteEconomyProgramRegistrationRequiredFields({}, ORG)).toBe(true)
  })

  it('필수 채우면 완료', () => {
    expect(hasIncompleteEconomyProgramRegistrationRequiredFields(filledRegistration(), ORG)).toBe(
      false
    )
  })

  it('설문 진행 항목을 하나도 고르지 않아도 완료이다', () => {
    const row = filledRegistration()
    row['economyRegistration.basicInfo.surveyItems'] = {
      survey: false,
      satisfaction: false,
      lecture_evaluation: false,
    }
    expect(hasIncompleteEconomyProgramRegistrationRequiredFields(row, ORG)).toBe(false)
    expect(listIncompleteEconomyProgramRegistrationRequiredFields(row, ORG)).not.toContain(
      'basicInfo.surveyItems'
    )
  })

  it('참여자 유형이 없으면 미완료', () => {
    expect(
      hasIncompleteEconomyProgramRegistrationRequiredFields(filledRegistration(), {
        individual: false,
        organization: false,
        teacherInstructor: false,
        volunteer: false,
      })
    ).toBe(true)
  })

  it('세부 프로그램이 과거 가짜 대표 sentinel 이면 미완료 (BE 마스터 id 필수)', () => {
    const row = filledRegistration()
    row['economyRegistration.basicInfo.detailedProgramId'] = '__economy_1c1s_main__'
    expect(hasIncompleteEconomyProgramRegistrationRequiredFields(row, ORG)).toBe(true)
  })

  it('세부 프로그램이「해당없음」이면 미완료', () => {
    const row = filledRegistration()
    row['economyRegistration.basicInfo.detailedProgramId'] = '__detailed_program_none__'
    expect(hasIncompleteEconomyProgramRegistrationRequiredFields(row, ORG)).toBe(true)
  })

  it('세부 프로그램 미기록이면 미완료 (기본값 없음)', () => {
    const row = filledRegistration()
    delete row['economyRegistration.basicInfo.detailedProgramId']
    expect(hasIncompleteEconomyProgramRegistrationRequiredFields(row, ORG)).toBe(true)
  })

  it('커리큘럼 단원명 비면 미완료', () => {
    const row = filledRegistration()
    row['economyRegistration.educationCurriculum.session1.title'] = ''
    expect(hasIncompleteEconomyProgramRegistrationRequiredFields(row, ORG)).toBe(true)
  })

  it('listIncomplete — KPI 강사 키를 반환한다', () => {
    const row = filledRegistration()
    row['economyRegistration.kpi.instructor'] = null
    expect(listIncompleteEconomyProgramRegistrationRequiredFields(row, ORG)).toContain(
      'kpi.instructor'
    )
  })
})

describe('economy recruitment required fields', () => {
  beforeEach(() => {
    resetApplicantRecruitInstitutionOverlayStoreForTests()
    resetGeneralRecruitOverlayStoreForTests()
    clearRegistrationStepTemplateSelections()
  })

  it('기관 모집만 채우면 완료 (상세 정보·썸네일 미입력 허용)', () => {
    replaceApplicantRecruitInstitutionOverlayForScope('recruitment-economy', {
      [RK.announcementPublished]: 'published',
      [RK.maxAssignableInstructors]: 2,
      [RK.maxClassCount]: 4,
      [RK.programRangeSeal]: RANGE,
      [RK.targetLevels]: ['elementary'],
      [RK.targetLevelDetail]: '초등',
      [RK.recruitRangeSeal]: RANGE,
      [RK.finalAnnounceIso]: '2026-10-01T00:00:00.000Z',
      [RK.finalAnnounceMethod]: '홈페이지',
      [RK.inquiryContact]: '담당',
      [RK.inquiryTel]: '010-0000-0000',
      [RK.inquiryEmail]: 'a@b.com',
      [RK.notesNotApplicable]: true,
    })
    expect(hasIncompleteEconomyProgramRecruitmentRequiredFields(ORG)).toBe(false)
  })

  it('dev autofill처럼 상세 썸네일이 null이어도 기관 모집만 채우면 완료', () => {
    replaceApplicantRecruitInstitutionOverlayForScope('recruitment-economy', {
      [RK.announcementPublished]: 'published',
      [RK.maxAssignableInstructors]: 2,
      [RK.maxClassCount]: 4,
      [RK.programRangeSeal]: RANGE,
      [RK.targetLevels]: ['elementary'],
      [RK.targetLevelDetail]: '초등',
      [RK.recruitRangeSeal]: RANGE,
      [RK.finalAnnounceIso]: '2026-10-01T00:00:00.000Z',
      [RK.finalAnnounceMethod]: '홈페이지',
      [RK.inquiryContact]: '담당',
      [RK.inquiryTel]: '010-0000-0000',
      [RK.inquiryEmail]: 'a@b.com',
      [RK.notesNotApplicable]: true,
    })
    replaceGeneralRecruitOverlayForScope('recruitment-economy', {
      'economyRecruit.detailInfo.programDescription': '설명',
      'economyRecruit.detailInfo.recruitmentGuide': '안내',
      'economyRecruit.detailInfo.applicationMethod': '지원',
      'economyRecruit.detailInfo.learningSupportContent': '학습지원',
      'economyRecruit.detailInfo.thumbFileName': null,
    })
    expect(hasIncompleteEconomyProgramRecruitmentRequiredFields(ORG)).toBe(false)
  })
})

describe('economy application required fields', () => {
  beforeEach(() => {
    resetGeneralApplicationOverlay()
    patchInstitutionSexOffenseConsentSubmissionRequest('no_submit')
  })

  it('신청 필수 채우면 완료', () => {
    replaceGeneralApplicationOverlay({
      'application.economy.basicInfo.applicationGrade': '초등 3',
      'application.economy.basicInfo.detailAddress': '서울',
      'application.economy.basicInfo.classCount': '2',
      'application.economy.basicInfo.totalStudents': '40',
      'application.economy.basicInfo.educationFormat': 'online',
      'application.economy.basicInfo.educationPlace': 'inside',
      'application.economy.basicInfo.educationPlaceDetail': '본관',
      'application.economy.basicInfo.teacherTel': '02-000',
      'application.economy.basicInfo.teacherMobile': '010-0000',
      'application.economy.basicInfo.teacherEmail': 't@a.com',
      'application.economy.basicInfo.applicationReason': '사유',
      'application.economy.basicInfo.otherRequests': '없음',
      'application.economy.guidanceAnswers': {
        'computer-in-room': '있음',
        'waiting-place': '연구실',
        meal: '불가',
        'other-notes': '없음',
      },
      'application.economy.lessonReply.companyType': 'partner',
      'application.economy.previousYearParticipation': 'no',
      'application.economy.schedule.first': {
        date: '2026-09-10',
        session: '1',
        firstClassPeriod: '1',
        firstStart: '2026-09-10T09:00:00',
        firstEnd: '2026-09-10T09:40:00',
      },
      'application.economy.schedule.second': {
        date: '2026-09-11',
        session: '1',
        firstClassPeriod: '2',
        firstStart: '2026-09-11T10:00:00',
        firstEnd: '2026-09-11T10:40:00',
      },
    })
    expect(hasIncompleteEconomyProgramApplicationRequiredFields()).toBe(false)
  })
})

describe('economy recruitment — 라디오 화면 기본값(강사 탭 일반 단락)', () => {
  beforeEach(() => {
    resetApplicantRecruitInstitutionOverlayStoreForTests()
    resetGeneralRecruitOverlayStoreForTests()
    clearRegistrationStepTemplateSelections()
  })

  const INSTRUCTOR_ONLY = {
    individual: false,
    organization: false,
    teacherInstructor: true,
    volunteer: false,
  } as const

  function filledInstructorWithoutPublished(): Record<string, unknown> {
    return {
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

  it('강사 탭 공고 게시 라디오 미조작(화면 미선택, QA-0121)이면 미입력으로 막는다', () => {
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', filledInstructorWithoutPublished())
    expect(listIncompleteEconomyProgramRecruitmentRequiredFields(INSTRUCTOR_ONLY)).toEqual([
      'recruit.instructor.announcementPublished',
    ])
  })

  it('기관 탭 공고 게시 빈 값(1사1교 RHF 기본 \'\' — 화면 미선택)은 그대로 필수다', () => {
    replaceApplicantRecruitInstitutionOverlayForScope('recruitment-economy', {
      [RK.announcementPublished]: '',
    })
    expect(listIncompleteEconomyProgramRecruitmentRequiredFields(ORG)).toContain(
      'recruit.institution.announcementPublished'
    )
  })
})
