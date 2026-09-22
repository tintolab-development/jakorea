/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  hasIncompleteUjatProgramRecruitmentRequiredFields,
  hasIncompleteUjatProgramRegistrationRequiredFields,
} from './ujat-program-registration-required-fields'
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
    'ujat.basicInfo.publicProgramTitle': '공고용',
    'ujat.basicInfo.detailedProgramId': '__ujat_volunteer_core__',
    'ujat.basicInfo.operationRangeSeal': RANGE,
    'ujat.basicInfo.participant.organization': true,
    'ujat.basicInfo.participant.volunteer': true,
    'ujat.basicInfo.businessField': 'economy_finance',
    'ujat.basicInfo.sponsorId': '__all__',
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

describe('hasIncompleteUjatProgramRegistrationRequiredFields', () => {
  beforeEach(() => {
    resetUjatProgramRegistrationOverlay()
  })

  it('빈 overlay면 미완료', () => {
    expect(hasIncompleteUjatProgramRegistrationRequiredFields({})).toBe(true)
  })

  it('필수 채우면 완료', () => {
    expect(hasIncompleteUjatProgramRegistrationRequiredFields(filledRegistration())).toBe(false)
  })
})

describe('hasIncompleteUjatProgramRecruitmentRequiredFields', () => {
  beforeEach(() => {
    resetUjatProgramRegistrationOverlay()
    resetUjatRecruitInstitutionOverlay()
    resetUjatRecruitVolunteerOverlay()
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
    replaceUjatRecruitVolunteerOverlay({
      [VK.announcementPublished]: true,
      [VK.noticeExposure]: 'before_recruit_end',
      [VK.programRange]: RANGE,
      [VK.volunteerTargets]: ['대학생'],
      [VK.targetDetail]: '대학생',
      [VK.recruitRangeH1]: RANGE,
      [VK.recruitRangeH2]: RANGE,
      [VK.activityTermH1]: '1',
      [VK.activityTermH2]: '2',
      [VK.docAnnounce]: { date: '2026-09-05T00:00:00.000Z', method: '홈페이지' },
      [VK.interviewMethod]: 'no',
      [VK.finalAnnounce]: { date: '2026-10-01T00:00:00.000Z', method: '이메일' },
      [VK.contact]: { name: '담당', phone: '010-0000-0000', email: 'a@b.com' },
      [VK.notes]: '-',
      [VK.otherNotes]: '-',
    })
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
    replaceUjatRecruitVolunteerOverlay({
      [VK.announcementPublished]: true,
      [VK.noticeExposure]: 'before_recruit_end',
      [VK.programRange]: RANGE,
      [VK.volunteerTargets]: ['대학생'],
      [VK.targetDetail]: '대학생',
      [VK.recruitRangeH1]: RANGE,
      [VK.recruitRangeH2]: RANGE,
      [VK.activityTermH1]: '1',
      [VK.activityTermH2]: '2',
      [VK.docAnnounce]: { date: '2026-09-05T00:00:00.000Z', method: '홈페이지' },
      [VK.interviewMethod]: 'no',
      [VK.finalAnnounce]: { date: '2026-10-01T00:00:00.000Z', method: '이메일' },
      [VK.contact]: { name: '담당', phone: '010-0000-0000', email: 'a@b.com' },
      [VK.notes]: '-',
      [VK.otherNotes]: '-',
    })
    expect(hasIncompleteUjatProgramRecruitmentRequiredFields()).toBe(false)
  })
})
