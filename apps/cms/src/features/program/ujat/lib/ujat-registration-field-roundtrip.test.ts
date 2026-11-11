import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
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
import { programToUjatRecruitTemplateFormValues } from '@/features/program/ujat/lib/use-ujat-recruit-template-form-overlay-sync'
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
    // a2f69b3aa: 교육 대상 상세는 district와 분리된 educationTargetDetail
    expect(institution.educationTargetDetail).toBe('초등학교 4~6학년')
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

  it('GET recruitments 기간·공고명이 overlay보다 우선한다', () => {
    const overlayRange = { start: '2026-03-01T00:00:00.000Z', end: '2026-03-31T00:00:00.000Z' }
    const rowStart = '2026-05-01T00:00:00.000Z'
    const rowEnd = '2026-05-31T00:00:00.000Z'
    const program = {
      ...buildUjatProgramListRowFromRegistrationSnapshot({
        id: 'ujat-row-ssot',
        overlay: {
          [IK.publicTitle]: 'overlay 기관 공고',
          [IK.recruitRange]: overlayRange,
          [IK.contact]: CONTACT,
          [VK.publicTitle]: 'overlay 봉사자 공고',
          [VK.recruitRangeH1]: overlayRange,
        },
      }),
      programRecruitments: [
        {
          recruitmentType: 'PARTICIPANT' as const,
          announcementTitle: '행 기관 공고',
          startAt: rowStart,
          endAt: rowEnd,
          contactName: '행 문의처',
        },
        {
          recruitmentType: 'VOLUNTEER' as const,
          recruitTerm: 'FIRST_HALF' as const,
          announcementTitle: '행 상반기 공고',
          startAt: rowStart,
          endAt: rowEnd,
        },
      ],
    }
    const institution = resolveUjatRecruitDisplayProgram(program, 'institution')
    expect(institution.applicationStartDate).toBe(rowStart)
    expect(institution.applicationEndDate).toBe(rowEnd)
    expect(institution.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName).toBe(
      '행 문의처'
    )
    expect(resolveUjatRecruitAnnouncementTitle(program, 'institution')).toBe('행 기관 공고')
    const volunteerH1 = resolveUjatRecruitDisplayProgram(program, 'volunteer_h1')
    expect(volunteerH1.volunteerApplicationStartDate).toBe(rowStart)
    expect(volunteerH1.volunteerApplicationEndDate).toBe(rowEnd)
    expect(resolveUjatRecruitAnnouncementTitle(program, 'volunteer_h1')).toBe('행 상반기 공고')
    const institutionEdit = programToUjatRecruitTemplateFormValues(institution, 'institution')
    expect(institutionEdit.applicationStartDate).toBe(rowStart)
    expect(institutionEdit.applicationEndDate).toBe(rowEnd)
    const volunteerEdit = programToUjatRecruitTemplateFormValues(volunteerH1, 'volunteer', 'h1')
    expect(volunteerEdit.volunteerApplicationStartDate).toBe(rowStart)
    expect(volunteerEdit.volunteerApplicationEndDate).toBe(rowEnd)
  })

  it('모집 fallback은 display 스냅샷이 아니라 draft 행을 유지한다', () => {
    const displayRows = [
      {
        recruitmentType: 'PARTICIPANT' as const,
        startAt: '2026-01-01T00:00:00.000Z',
        endAt: '2026-01-31T00:00:00.000Z',
      },
    ]
    const draftRows = [
      {
        recruitmentType: 'PARTICIPANT' as const,
        startAt: '2026-03-01T00:00:00.000Z',
        endAt: '2026-03-31T00:00:00.000Z',
      },
    ]
    const draft = {
      ...buildUjatProgramListRowFromRegistrationSnapshot({
        id: 'ujat-fallback-rows',
        overlay: FULL_OVERLAY,
      }),
      programRecruitments: draftRows,
    }
    const display = { ...draft, programRecruitments: displayRows }
    const fallback = { ...draft, programRecruitments: draft.programRecruitments }
    expect(fallback.programRecruitments).toEqual(draftRows)
    expect(fallback.programRecruitments).not.toEqual(display.programRecruitments)
  })

  it('하반기 행이 없으면 startAt 순서로 상반기를 하반기로 쓰지 않는다', () => {
    const program = {
      ...buildUjatProgramListRowFromRegistrationSnapshot({
        id: 'ujat-no-h2-guess',
        overlay: { [VK.recruitRangeH2]: RANGE },
      }),
      programRecruitments: [
        {
          recruitmentType: 'VOLUNTEER' as const,
          recruitTerm: 'FIRST_HALF' as const,
          startAt: '2026-01-01T00:00:00.000Z',
          endAt: '2026-01-31T00:00:00.000Z',
        },
      ],
    }
    const h2 = resolveUjatRecruitDisplayProgram(program, 'volunteer_h2')
    expect(h2.volunteerApplicationStartDate).not.toBe('2026-01-01T00:00:00.000Z')
  })

  it('빈 공통정보·지급항목 []·KPI null/0 표시 규칙을 지킨다', () => {
    const empty = buildUjatProgramListRowFromRegistrationSnapshot({
      id: 'ujat-empty-echo',
      overlay: { [UJAT_WAGE_OVERLAY_PAYMENT_KEY]: [] },
    })
    empty.title = ''
    empty.mainTitle = ''
    empty.titleEn = ''
    empty.businessArea = undefined
    empty.generalCommonInfo = {
      ...empty.generalCommonInfo,
      kpi: {
        finalParticipants: undefined,
        instructorCount: undefined,
        volunteerCount: undefined,
        finalSchools: undefined,
        finalClasses: 0,
      } as unknown as NonNullable<Program['generalCommonInfo']>['kpi'],
    }
    const display = resolveUjatRegistrationBasicInfoDisplay(empty)
    expect(display.repKo).toBe('-')
    expect(display.repEn).toBe('-')
    expect(display.programManagementName).toBe('-')
    expect(display.businessField).toBe('-')
    expect(resolveUjatWageInfoDisplay(empty).paymentItemsText).toBe('-')
    expect(empty.generalCommonInfo?.kpi?.finalClasses).toBe(0)
    expect(empty.generalCommonInfo?.kpi?.finalParticipants).toBeUndefined()
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
