import { describe, expect, it } from 'vitest'
import { buildUjatProgramListRowFromRegistrationSnapshot } from '@/features/program/ujat/lib/ujat-registration-local-save'
import { resolveUjatRegistrationBasicInfoDisplay } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { resolveUjatWageInfoDisplay } from '@/features/program/ujat/lib/ujat-wage-info-display'
import { resolveUjatHalfEducationScheduleDisplay } from '@/features/program/ujat/lib/ujat-half-education-schedule-display'
import { resolveUjatRegionCapacityBySemester } from '@/features/program/ujat/lib/ujat-region-capacity-display'
import { UJAT_REGION_CAPACITY_OVERLAY_KEY } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { UJAT_WAGE_OVERLAY_PAYMENT_KEY } from '@/features/program/ujat/lib/ujat-wage-info-display'
import { UJAT_RECRUIT_INSTITUTION_OVERLAY_KEYS as IK } from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import { UJAT_RECRUIT_VOLUNTEER_OVERLAY_KEYS as VK } from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import { UJAT_APPLICATION_INSTITUTION_OVERLAY_KEYS as AI } from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import { UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS as AV } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  resolveUjatRecruitAnnouncementTitle,
  resolveUjatRecruitDisplayProgram,
} from '@/features/program/ujat/lib/ujat-recruit-display-program'
import { resolveUjatVolunteerActivityTermDisplay } from '@/features/program/ujat/ui/detail-modal/info/ujat-recruit-program-round'
import { UJAT_DETAILED_PROGRAM_UJAT_LABEL } from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'

const RANGE = { start: '2026-03-01T00:00:00.000Z', end: '2026-06-30T00:00:00.000Z' }
const RESULT = { date: '2026-04-01T00:00:00.000Z', method: '홈페이지 공지' }
const CONTACT = { name: '모집팀', phone: '02-111-2222', email: 'recruit@jakorea.org' }

const FULL_OVERLAY: Record<string, unknown> = {
  'ujat.basicInfo.repKo': '대표 국문명',
  'ujat.basicInfo.repEn': 'Official English Title',
  'ujat.basicInfo.programManagementName': '프로그램 관리명',
  'ujat.basicInfo.detailedProgramId': '__ujat_volunteer_core__',
  'ujat.basicInfo.detailedProgramName': UJAT_DETAILED_PROGRAM_UJAT_LABEL,
  'ujat.basicInfo.operationRangeSeal': RANGE,
  'ujat.basicInfo.businessField': 'economy_finance',
  'ujat.basicInfo.sponsorId': '__all__',
  'ujat.basicInfo.educationCourse': 'digital_computer',
  'ujat.basicInfo.ipOwned': 'ja',
  'ujat.basicInfo.courseDeliveredBy': 'ja',
  'ujat.basicInfo.partnerInvolvement': 'no',
  'ujat.basicInfo.ipsCategory': 'prepare',
  'ujat.kpi.participantCount': 10,
  'ujat.kpi.volunteer': 4,
  'ujat.kpi.dispatchedSchool': 2,
  'ujat.kpi.dispatchedClass': 5,
  [UJAT_WAGE_OVERLAY_PAYMENT_KEY]: ['p-1'],
  'ujat.h1.event.name': '상반기 본행사',
  'ujat.h1.event.range': RANGE,
  'ujat.h2.event.name': '하반기 본행사',
  'ujat.h2.event.range': RANGE,
  [UJAT_REGION_CAPACITY_OVERLAY_KEY]: {
    h1: { 서울: { classCount: '3', volunteerCount: '6' } },
    h2: { 서울: { classCount: '2', volunteerCount: '4' } },
  },
  [IK.publicTitle]: '기관 공고용 프로그램명',
  [IK.programRange]: RANGE,
  [IK.targetLevels]: ['elementary'],
  [IK.district]: '초등학교 4~6학년',
  [IK.recruitRange]: RANGE,
  [IK.resultAnnounce]: RESULT,
  [IK.contact]: CONTACT,
  [IK.notes]: '기관 비고',
  [VK.publicTitle]: '봉사자 공고용 프로그램명',
  [VK.programRange]: RANGE,
  [VK.volunteerTargets]: ['대학(원)생'],
  [VK.targetDetail]: '전공무관',
  [VK.recruitRangeH1]: RANGE,
  [VK.recruitRangeH2]: RANGE,
  [VK.activityTermH1]: '7',
  [VK.activityTermH2]: '8',
  [VK.docAnnounce]: RESULT,
  [VK.interviewMethod]: 'offline',
  [VK.finalAnnounce]: RESULT,
  [VK.contact]: { name: '봉사팀', phone: '02-333-4444', email: 'vol@jakorea.org' },
  [AI.applicationRegion]: '서울',
  [AV.universityName]: '한국대학교',
  [AV.preferredRegion]: ['서울'],
}

describe('UJAT 등록 필드 → 상세 표시 누락 점검', () => {
  it('공통정보 overlay 값이 생성 스냅샷과 상세 resolver에 남는다', () => {
    const program = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-roundtrip',
      overlay: FULL_OVERLAY,
    })
    const basic = resolveUjatRegistrationBasicInfoDisplay(program)
    expect(basic.repKo).toBe('대표 국문명')
    expect(basic.repEn).toBe('Official English Title')
    expect(basic.programManagementName).toBe('프로그램 관리명')
    expect(program.generalCommonInfo?.kpi?.finalParticipants).toBe(10)
    expect(program.generalCommonInfo?.kpi?.volunteerCount).toBe(4)
    expect(resolveUjatWageInfoDisplay(program).paymentItemIds).toEqual(['p-1'])
    expect(resolveUjatHalfEducationScheduleDisplay('h1', FULL_OVERLAY).eventSchedule.scheduleName).toBe(
      '상반기 본행사'
    )
    expect(resolveUjatHalfEducationScheduleDisplay('h2', FULL_OVERLAY).eventSchedule.scheduleName).toBe(
      '하반기 본행사'
    )
    const capacity = resolveUjatRegionCapacityBySemester(FULL_OVERLAY)
    expect(capacity.h1['서울']?.classCount).toBe('3')
    expect(capacity.h2['서울']?.volunteerCount).toBe('4')
  })

  it('모집정보 기관/봉사자 입력은 각 탭 display에서 읽는다', () => {
    const program = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-roundtrip-recruit',
      overlay: FULL_OVERLAY,
    })
    expect(resolveUjatRecruitAnnouncementTitle(program, 'institution')).toBe('기관 공고용 프로그램명')
    expect(resolveUjatRecruitAnnouncementTitle(program, 'volunteer')).toBe(
      '봉사자 공고용 프로그램명'
    )
    const institution = resolveUjatRecruitDisplayProgram(program, 'institution')
    expect(institution.startDate).toBe(RANGE.start)
    expect(institution.district).toBe('초등학교 4~6학년')
    expect(institution.applicationStartDate).toBe(RANGE.start)
    expect(institution.resultAnnouncementMethod).toBe('홈페이지 공지')
    expect(institution.managerName).toBe('모집팀')
    expect(institution.oneLineIntroduction).toBe('기관 비고')

    const volunteer = resolveUjatRecruitDisplayProgram(program, 'volunteer')
    expect(volunteer.volunteerTargetDetail).toBe('전공무관')
    expect(volunteer.volunteerTargets).toEqual(['대학(원)생'])
    expect(volunteer.interviewMethod).toBe('offline')
    expect(volunteer.contactPhone).toBe('02-333-4444')
    expect(resolveUjatVolunteerActivityTermDisplay(program, 'h1')).toBe('7')
    expect(resolveUjatVolunteerActivityTermDisplay(program, 'h2')).toBe('8')
  })

  it('신청정보 overlay 키가 생성 스냅샷에 남는다', () => {
    const program = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-roundtrip-application',
      overlay: FULL_OVERLAY,
    })
    expect(program.ujatRegistrationOverlay?.[AI.applicationRegion]).toBe('서울')
    expect(program.ujatRegistrationOverlay?.[AV.universityName]).toBe('한국대학교')
    expect(program.ujatRegistrationOverlay?.[AV.preferredRegion]).toEqual(['서울'])
  })
})
