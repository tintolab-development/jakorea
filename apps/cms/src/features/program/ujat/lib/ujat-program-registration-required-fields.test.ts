/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  describeIncompleteUjatProgramRecruitmentRequiredFields,
  describeIncompleteUjatProgramRegistrationRequiredFields,
  formatUjatRegistrationRequiredFieldReason,
  hasIncompleteUjatProgramRecruitmentRequiredFields,
  hasIncompleteUjatProgramRegistrationRequiredFields,
  listIncompleteUjatProgramRecruitmentTypedRequiredFields,
  listIncompleteUjatProgramRegistrationRequiredFields,
} from './ujat-program-registration-required-fields'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { ujatBasicInfoFormValuesFromLegacyOverlay } from './ujat-basic-info-form'
import { typedDetailFromUjatOverlay } from '@/features/program/ujat/api/typed-detail-client'
import {
  replaceUjatRecruitInstitutionOverlay,
  resetUjatRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  replaceUjatRecruitVolunteerOverlay,
  resetUjatRecruitVolunteerOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import {
  patchUjatProgramRegistrationOverlay,
  resetUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS as IK } from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import { UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS as VK } from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import { snapshotVolunteerHalfFromLegacy } from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'
import { UJAT_WAGE_OVERLAY_PAYMENT_KEY } from '@/features/program/ujat/lib/ujat-wage-info-display'
import {
  replaceGeneralRecruitOverlay,
  resetGeneralRecruitOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

vi.mock('@/features/program/ujat/lib/ujat-education-regions', () => ({
  listUjatEducationRegionsActive: () => [{ key: 'seoul', label: '서울' }],
}))

const RANGE = { start: '2026-09-01T00:00:00.000Z', end: '2026-09-30T00:00:00.000Z' }
const MULTI = {
  rowIds: [0],
  regionByRow: { '0': ['seoul'] },
  dateByRow: { '0': '2026-09-10T00:00:00.000Z' },
}

function filledRegistration(): Record<string, unknown> {
  return {
    'ujat.basicInfo.repKo': '대학생경제교육봉사단',
    'ujat.basicInfo.repEn': 'University Students JA Team',
    'ujat.basicInfo.programManagementName': '관리명',
    'ujat.basicInfo.detailedProgramId': '__ujat_volunteer_core__',
    'ujat.basicInfo.operationRangeSeal': RANGE,
    'ujat.basicInfo.participant.organization': true,
    'ujat.basicInfo.participant.volunteer': true,
    'ujat.basicInfo.businessField': 'economy_finance',
    'ujat.basicInfo.sponsorId': 'sponsor-1',
    'ujat.basicInfo.sponsorContactId': 'contact-1',
    'ujat.basicInfo.surveyItems': {
      survey: true,
      satisfaction: true,
      school_satisfaction: true,
      lecture_evaluation: true,
    },
    'ujat.basicInfo.educationCourse': 'elementary_economy',
    'ujat.basicInfo.ipOwned': 'ja',
    'ujat.basicInfo.courseDeliveredBy': 'ja',
    'ujat.basicInfo.partnerInvolvement': 'no',
    'ujat.basicInfo.ipsCategory': 'prepare',
    'ujat.kpi.participantCount': 30,
    'ujat.kpi.volunteer': 10,
    'ujat.kpi.dispatchedSchool': 5,
    'ujat.kpi.dispatchedClass': 12,
    'ujat.h1.pre.name': '상반기 사전교육',
    'ujat.h1.event.name': '상반기 교육',
    'ujat.h1.event.range': RANGE,
    'ujat.h1.pre.multi': MULTI,
    'ujat.h1.closing.multi': MULTI,
    'ujat.h2.pre.name': '하반기 사전교육',
    'ujat.h2.event.name': '하반기 교육',
    'ujat.h2.event.range': RANGE,
    'ujat.h2.pre.multi': MULTI,
    'ujat.h2.closing.multi': MULTI,
    'ujat.capacity.byRegion': {
      h1: { 서울: { classCount: '4', volunteerCount: '8' } },
      h2: { 서울: { classCount: '4', volunteerCount: '8' } },
    },
  }
}

function filledVolunteerBothHalves(): Record<string, unknown> {
  const shared = {
    [VK.announcementPublished]: true,
    [VK.noticeExposure]: 'before_recruit_end',
    [VK.programRange]: RANGE,
    [VK.volunteerTargets]: ['대학생'],
    [VK.targetDetail]: '대학생',
    [VK.recruitRange]: RANGE,
    [VK.recruitRangeH1]: RANGE,
    [VK.recruitRangeH2]: RANGE,
    [VK.activityTermH1]: '1',
    [VK.activityTermH2]: '2',
    [VK.docAnnounce]: { date: '2026-09-05T00:00:00.000Z', method: '홈페이지' },
    [VK.interviewRange]: RANGE,
    [VK.interviewMethod]: 'offline',
    [VK.finalAnnounce]: { date: '2026-10-01T00:00:00.000Z', method: '이메일' },
    [VK.contact]: { name: '담당', phone: '010-0000-0000', email: 'a@b.com' },
    [VK.notes]: '-',
    [VK.otherNotes]: '-',
  }
  return {
    ...shared,
    ...snapshotVolunteerHalfFromLegacy(shared, 'h1'),
    ...snapshotVolunteerHalfFromLegacy(shared, 'h2'),
  }
}

function filledVolunteerInterviewSchedules(): Record<string, unknown> {
  const timeRange = [new Date('2026-09-18T09:00:00.000Z'), new Date('2026-09-18T12:00:00.000Z')]
  return {
    'recruit.volunteer.h1.interview.interviewTimeRange': timeRange,
    'recruit.volunteer.h1.interview.timeUnit': '30',
    'recruit.volunteer.h1.interview.selectedSlotKeys': ['09:00-09:30'],
    'recruit.volunteer.h2.interview.interviewTimeRange': timeRange,
    'recruit.volunteer.h2.interview.timeUnit': '30',
    'recruit.volunteer.h2.interview.selectedSlotKeys': ['09:00-09:30'],
  }
}

function filledInstitutionRecruitment(): Record<string, unknown> {
  return {
    [IK.announcementPublished]: true,
    [IK.programRange]: RANGE,
    [IK.targetLevels]: ['elementary'],
    [IK.district]: '초등',
    [IK.recruitRange]: RANGE,
    [IK.resultAnnounce]: { date: '2026-10-01T00:00:00.000Z', method: '이메일' },
    [IK.contact]: { name: '담당', phone: '010-0000-0000', email: 'a@b.com' },
    [IK.notes]: '-',
  }
}

function setupCompleteRecruitment(): void {
  replaceUjatRecruitInstitutionOverlay(filledInstitutionRecruitment())
  replaceUjatRecruitVolunteerOverlay(filledVolunteerBothHalves())
  replaceGeneralRecruitOverlay(filledVolunteerInterviewSchedules())
}

function typedFromOverlay(overlay: Record<string, unknown>) {
  return {
    basicInfo: ujatBasicInfoFormValuesFromLegacyOverlay(overlay),
    typedDetail: typedDetailFromUjatOverlay(overlay),
  }
}

describe('hasIncompleteUjatProgramRegistrationRequiredFields', () => {
  beforeEach(() => {
    resetUjatProgramRegistrationOverlay()
  })

  it('빈 overlay면 미완료', () => {
    expect(hasIncompleteUjatProgramRegistrationRequiredFields({})).toBe(true)
  })

  it('대표명·관리명이 비어 있으면 필드명과 함께 미완료이다', () => {
    const overlay = filledRegistration()
    overlay['ujat.basicInfo.repKo'] = ''
    overlay['ujat.basicInfo.repEn'] = ''
    overlay['ujat.basicInfo.programManagementName'] = ''
    const typed = typedFromOverlay(overlay)
    typed.basicInfo.mainTitle = ''
    typed.basicInfo.titleEn = ''
    typed.basicInfo.title = ''
    expect(
      listIncompleteUjatProgramRegistrationRequiredFields(
        overlay,
        typed.basicInfo,
        typed.typedDetail
      )
    ).toEqual(
      expect.arrayContaining([
        'basicInfo.repKo',
        'basicInfo.repEn',
        'basicInfo.programManagementName',
      ])
    )
  })

  it('필수 채우면 완료', () => {
    const overlay = filledRegistration()
    const typed = typedFromOverlay(overlay)
    expect(
      hasIncompleteUjatProgramRegistrationRequiredFields(
        overlay,
        typed.basicInfo,
        typed.typedDetail
      )
    ).toBe(false)
  })

  it('설문 진행 항목을 하나도 고르지 않아도 완료이다', () => {
    const overlay = filledRegistration()
    overlay['ujat.basicInfo.surveyItems'] = {
      survey: false,
      satisfaction: false,
      school_satisfaction: false,
      lecture_evaluation: false,
    }
    const typed = typedFromOverlay(overlay)
    expect(
      hasIncompleteUjatProgramRegistrationRequiredFields(
        overlay,
        typed.basicInfo,
        typed.typedDetail
      )
    ).toBe(false)
    expect(
      listIncompleteUjatProgramRegistrationRequiredFields(
        overlay,
        typed.basicInfo,
        typed.typedDetail
      )
    ).not.toContain('basicInfo.surveyItems')
  })

  it('사전 교육 진행 일정이 없으면 미완료', () => {
    const overlay = filledRegistration()
    overlay['ujat.h1.pre.multi'] = {
      rowIds: [0],
      regionByRow: { '0': ['seoul'] },
      dateByRow: { '0': null },
    }
    const typed = typedFromOverlay(overlay)
    expect(
      describeIncompleteUjatProgramRegistrationRequiredFields(
        overlay,
        typed.basicInfo,
        typed.typedDetail
      )
    ).toBe('h1.pre.schedule')
    expect(
      hasIncompleteUjatProgramRegistrationRequiredFields(
        overlay,
        typed.basicInfo,
        typed.typedDetail
      )
    ).toBe(true)
  })

  it('Typed RHF 0/false/[]는 오래된 Overlay 값을 쓰지 않는다', () => {
    const overlay = filledRegistration()
    overlay['ujat.kpi.participantCount'] = 10
    overlay['ujat.basicInfo.partnerInvolvement'] = 'yes'
    overlay[UJAT_WAGE_OVERLAY_PAYMENT_KEY] = ['stale']
    const typed = typedFromOverlay(overlay)
    typed.basicInfo.kpiFinalParticipants = 0
    typed.basicInfo.partnerInvolvement = false
    typed.basicInfo.wagePaymentItemIds = []
    const incomplete = listIncompleteUjatProgramRegistrationRequiredFields(
      overlay,
      typed.basicInfo,
      typed.typedDetail
    )
    expect(incomplete).not.toContain('kpi.participantCount')
    expect(incomplete).not.toContain('basicInfo.partnerInvolvement')
    expect(incomplete).not.toContain('wage.paymentItemValues')
  })
})

describe('hasIncompleteUjatProgramRecruitmentRequiredFields', () => {
  beforeEach(() => {
    resetUjatProgramRegistrationOverlay()
    resetUjatRecruitInstitutionOverlay()
    resetUjatRecruitVolunteerOverlay()
    resetGeneralRecruitOverlay()
  })

  it('기관·봉사 모집만 채우면 완료 (상세 정보·썸네일 미입력 허용)', () => {
    replaceUjatRecruitInstitutionOverlay({
      [IK.announcementPublished]: true,
      [IK.programRange]: RANGE,
      [IK.targetLevels]: ['elementary'],
      [IK.district]: '초등',
      [IK.recruitRange]: RANGE,
      [IK.resultAnnounce]: { date: '2026-10-01T00:00:00.000Z', method: '이메일' },
      [IK.contact]: { name: '담당', phone: '010-0000-0000', email: 'a@b.com' },
      [IK.notes]: '-',
    })
    replaceUjatRecruitVolunteerOverlay(filledVolunteerBothHalves())
    replaceGeneralRecruitOverlay(filledVolunteerInterviewSchedules())
    expect(hasIncompleteUjatProgramRecruitmentRequiredFields()).toBe(false)
  })

  it('registration overlay에 모집 값이 있어도 병합 검사', () => {
    patchUjatProgramRegistrationOverlay({
      [IK.announcementPublished]: true,
      [IK.programRange]: RANGE,
      [IK.targetLevels]: ['elementary'],
      [IK.district]: '초등',
      [IK.recruitRange]: RANGE,
      [IK.resultAnnounce]: { date: '2026-10-01T00:00:00.000Z', method: '이메일' },
      [IK.contact]: { name: '담당', phone: '010-0000-0000', email: 'a@b.com' },
      [IK.notes]: '-',
    })
    replaceUjatRecruitVolunteerOverlay(filledVolunteerBothHalves())
    replaceGeneralRecruitOverlay(filledVolunteerInterviewSchedules())
    expect(hasIncompleteUjatProgramRecruitmentRequiredFields()).toBe(false)
  })

  it('면접 진행 가능 일정 슬롯이 없으면 미완료', () => {
    replaceUjatRecruitInstitutionOverlay({
      [IK.announcementPublished]: true,
      [IK.programRange]: RANGE,
      [IK.targetLevels]: ['elementary'],
      [IK.district]: '초등',
      [IK.recruitRange]: RANGE,
      [IK.resultAnnounce]: { date: '2026-10-01T00:00:00.000Z', method: '이메일' },
      [IK.contact]: { name: '담당', phone: '010-0000-0000', email: 'a@b.com' },
      [IK.notes]: '-',
    })
    replaceUjatRecruitVolunteerOverlay(filledVolunteerBothHalves())
    replaceGeneralRecruitOverlay({
      ...filledVolunteerInterviewSchedules(),
      'recruit.volunteer.h2.interview.selectedSlotKeys': [],
    })
    expect(describeIncompleteUjatProgramRecruitmentRequiredFields()).toBe(
      'recruit.volunteer.h2.interviewSchedule'
    )
    expect(hasIncompleteUjatProgramRecruitmentRequiredFields()).toBe(true)
  })

  it.each([
    ['REG-03 참여기관 모집', 'institution', IK.notes],
    ['REG-04 상반기 봉사자 모집', 'volunteer', VK.activityTermH1],
    ['REG-05 하반기 봉사자 모집', 'volunteer', VK.activityTermH2],
  ] as const)('%s만 비우면 신청 단계 이동 gate가 미완료를 반환한다', (_label, scope, key) => {
    setupCompleteRecruitment()
    if (scope === 'institution') {
      const institution = filledInstitutionRecruitment()
      delete institution[key]
      replaceUjatRecruitInstitutionOverlay(institution)
    } else {
      const volunteer = filledVolunteerBothHalves()
      delete volunteer[key]
      replaceUjatRecruitVolunteerOverlay(volunteer)
    }

    expect(hasIncompleteUjatProgramRecruitmentRequiredFields()).toBe(true)
  })

  it('미게시여도 다른 필수값이 있으면 완료이다', () => {
    replaceUjatRecruitInstitutionOverlay({
      ...filledInstitutionRecruitment(),
      [IK.announcementPublished]: false,
    })
    const volunteer = filledVolunteerBothHalves()
    volunteer[VK.announcementPublished] = false
    volunteer['ujat.recruit.volunteer.h1.announcementPublished'] = false
    volunteer['ujat.recruit.volunteer.h2.announcementPublished'] = false
    replaceUjatRecruitVolunteerOverlay(volunteer)
    replaceGeneralRecruitOverlay(filledVolunteerInterviewSchedules())
    expect(hasIncompleteUjatProgramRecruitmentRequiredFields()).toBe(false)
  })
})

const INTERVIEW_CONFIG = {
  interviewTimeRange: ['2026-09-18T09:00:00.000Z', '2026-09-18T12:00:00.000Z'],
  selectedSlotKeys: ['09:00-09:30'],
}

function filledTypedInstitution(
  published: 'published' | 'unpublished' = 'published'
): Partial<ProgramDetailEditFormValues> {
  return {
    participantRecruitmentAnnouncementPublished: published,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    targetLevels: ['elementary'],
    district: '초등',
    applicationStartDate: '2026-09-01',
    applicationEndDate: '2026-09-30',
    resultAnnouncementDate: '2026-10-01',
    resultAnnouncementMethod: '이메일',
    recruitmentContactOrganizationName: '담당',
    contactPhone: '010-0000-0000',
    contactEmail: 'a@b.com',
    oneLineIntroduction: '-',
  }
}

function filledTypedVolunteer(
  published: 'published' | 'unpublished' = 'published'
): Partial<ProgramDetailEditFormValues> {
  return {
    volunteerRecruitmentAnnouncementPublished: published,
    volunteerRecruitmentNoticeExposure: 'start-day',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    volunteerTargets: ['대학생'],
    volunteerTargetDetail: '대학생',
    volunteerApplicationStartDate: '2026-09-01',
    volunteerApplicationEndDate: '2026-09-30',
    rounds: [
      {
        id: 'r1',
        programId: 'p1',
        roundNumber: 1,
        status: 'active',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        curriculum: '1',
      },
      {
        id: 'r2',
        programId: 'p1',
        roundNumber: 2,
        status: 'active',
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        curriculum: '2',
      },
    ],
    documentPassAnnouncementDate: '2026-09-05',
    documentPassAnnouncementMethod: '홈페이지',
    interviewMethod: 'no',
    interviewStartDate: '2026-09-10',
    interviewEndDate: '2026-09-12',
    finalPassAnnouncementDate: '2026-10-01',
    finalPassAnnouncementMethod: '이메일',
    volunteerRecruitmentContactOrganizationName: '담당',
    contactPhone: '010-0000-0000',
    contactEmail: 'a@b.com',
    oneLineIntroduction: '-',
    volunteerInterviewConfig: INTERVIEW_CONFIG,
  }
}

describe('listIncompleteUjatProgramRecruitmentTypedRequiredFields', () => {
  it.each(['published', 'unpublished'] as const)(
    '%s여도 다른 필수값이 있으면 완료이다',
    published => {
      expect(
        listIncompleteUjatProgramRecruitmentTypedRequiredFields({
          institution: filledTypedInstitution(published),
          volunteerH1: filledTypedVolunteer(published),
          volunteerH2: filledTypedVolunteer(published),
        })
      ).toEqual([])
    }
  )

  it('게시 여부를 고르지 않으면 미완료이다', () => {
    const institution = filledTypedInstitution()
    delete institution.participantRecruitmentAnnouncementPublished
    expect(
      listIncompleteUjatProgramRecruitmentTypedRequiredFields({ institution })
    ).toContain('recruit.institution.announcementPublished')
  })

  it('게시인데 모집 기간이 비면 미완료이다', () => {
    const institution = filledTypedInstitution('published')
    institution.applicationStartDate = ''
    institution.applicationEndDate = ''
    expect(
      listIncompleteUjatProgramRecruitmentTypedRequiredFields({ institution })
    ).toContain('recruit.institution.recruitRangeSeal')
  })

  it('미게시이면 모집 기간·발표일이 비어도 완료이다', () => {
    const institution = filledTypedInstitution('unpublished')
    institution.applicationStartDate = ''
    institution.applicationEndDate = ''
    institution.resultAnnouncementDate = ''
    institution.startDate = ''
    institution.endDate = ''
    expect(
      listIncompleteUjatProgramRecruitmentTypedRequiredFields({
        institution,
        volunteerH1: filledTypedVolunteer('unpublished'),
        volunteerH2: filledTypedVolunteer('unpublished'),
      })
    ).toEqual([])
  })

  it.each(['published', 'unpublished'] as const)(
    '%s에서 비고를 비우면 같은 필드로 미완료이다',
    published => {
      const institution = filledTypedInstitution(published)
      institution.oneLineIntroduction = ''
      expect(
        listIncompleteUjatProgramRecruitmentTypedRequiredFields({ institution })
      ).toEqual(['recruit.institution.notes'])
    }
  )
})

describe('formatUjatRegistrationRequiredFieldReason', () => {
  it('미게시 검증 키를 공고 게시 여부 라벨로 바꾼다', () => {
    expect(formatUjatRegistrationRequiredFieldReason('recruit.institution.announcementPublished')).toBe(
      '참여 기관 모집 · 공고 게시 여부'
    )
  })
})
