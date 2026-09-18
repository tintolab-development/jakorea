/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  hasIncompleteEconomyProgramApplicationRequiredFields,
  hasIncompleteEconomyProgramRegistrationRequiredFields,
  hasIncompleteEconomyProgramRecruitmentRequiredFields,
} from './economy-program-registration-required-fields'
import {
  replaceApplicantRecruitInstitutionOverlay,
  resetApplicantRecruitInstitutionOverlay,
  APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as RK,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  replaceGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
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
    'economyRegistration.basicInfo.detailedProgramId': '__economy_1c1s_main__',
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

  it('커리큘럼 단원명 비면 미완료', () => {
    const row = filledRegistration()
    row['economyRegistration.educationCurriculum.session1.title'] = ''
    expect(hasIncompleteEconomyProgramRegistrationRequiredFields(row, ORG)).toBe(true)
  })
})

describe('economy recruitment required fields', () => {
  beforeEach(() => {
    resetApplicantRecruitInstitutionOverlay()
    resetGeneralRecruitOverlay()
  })

  it('기관 모집+상세를 채우면 완료', () => {
    replaceApplicantRecruitInstitutionOverlay({
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
    replaceGeneralRecruitOverlay({
      'economyRecruit.detailInfo.programDescription': '설명',
      'economyRecruit.detailInfo.recruitmentGuide': '안내',
      'economyRecruit.detailInfo.applicationMethod': '지원',
      'economyRecruit.detailInfo.learningSupportContent': '학습지원',
      'economyRecruit.detailInfo.thumbFileName': 'thumb.png',
    })
    expect(hasIncompleteEconomyProgramRecruitmentRequiredFields(ORG)).toBe(false)
  })

  it('상세 프로그램 설명 비면 미완료', () => {
    replaceApplicantRecruitInstitutionOverlay({
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
    replaceGeneralRecruitOverlay({
      'economyRecruit.detailInfo.programDescription': '',
      'economyRecruit.detailInfo.recruitmentGuide': '안내',
      'economyRecruit.detailInfo.applicationMethod': '지원',
      'economyRecruit.detailInfo.learningSupportContent': '학습지원',
      'economyRecruit.detailInfo.thumbFileName': 'thumb.png',
    })
    expect(hasIncompleteEconomyProgramRecruitmentRequiredFields(ORG)).toBe(true)
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
