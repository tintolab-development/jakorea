/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  mapGeneralProgramToCreateRequest,
  mapGeneralProgramToUpdateRequest,
} from '@/features/program/general/api/adapters/general-program-adapters'
import {
  programToGeneralCommonInfoEditValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { mergeProgramSponsorAssignments } from '@/features/program/shared/lib/merge-program-sponsor-assignments'
import { createGeneralProgramCommonInfoIndependentSave } from './common-info-independent-save'
import { GENERAL_SPONSOR_PATCH_STATUS } from './general-detail-rhf-save-path'
import { mapCompanySchoolToUpdateRequest } from '@/features/program/1c-1s/api/adapters'
import { toUpdateRequest as mapUjatToUpdateRequest } from '@/features/program/ujat/api/adapters'
import {
  hasIncompleteGeneralProgramRegistrationRequiredFields,
  type GeneralProgramRegistrationRequiredFieldContext,
} from '@/features/program/general/lib/registration-required-fields'

const GET_WAGE_ROWS = [
  { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 140,000원' },
  { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
  { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 100,000원' },
] as const

function threeSponsorProgram(): Program {
  const now = '2026-10-21T00:00:00.000Z'
  return {
    id: '186304',
    sponsorId: '1627251',
    managerName: '담당자A',
    title: '일반기관공통정보',
    mainTitle: '일반기관공통정보',
    titleEn: 'Org Program',
    detailedProgramId: 'dp-1',
    educationProcess: 'Traditional (Paper)',
    ipOwned: 'JA',
    courseDeliveredBy: 'JA',
    ips: 'Prepare',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-04-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    partnerInvolvement: false,
    generalProgramAudience: 'organization',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'multi',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      detailedProgramName: '기존 세부프로그램',
      venueKind: 'inside',
      venueDetail: '서울시 강남구',
      sponsorManagementIds: ['1627251', '163301', '163388'],
      sponsorManagerContactIds: [
        '1627251::1627253',
        '163301::163322',
        '163388::163389',
      ],
      sponsorManagerContactNames: {
        '1627251::1627253': '담당자A',
        '163301::163322': '담당자B',
        '163388::163389': '담당자C',
      },
      educationScheduleLines: ['26년 4월 1일(수) 10:00 ~ 12:00'],
      educationFormLabel: '오프라인',
      participationMethod: 'team',
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1차시', title: '단원1', description: '본문1' },
        { sessionNo: 2, sessionLabel: '2차시', title: '단원2', description: '본문2' },
      ],
      scheduleDetails: [],
      wageGradeRows: [...GET_WAGE_ROWS],
      paymentItems: '교통비, 식사비',
      deductionItems: '일용근로자 원천징수세액',
      kpi: {
        finalParticipants: 80,
        instructorCount: 2,
        volunteerCount: 1,
        finalSchools: 4,
        finalClasses: 8,
      },
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parseJson(json: string | undefined): {
  generalCommonInfo?: Record<string, unknown>
  registrationOverlay?: Record<string, unknown>
  registration?: { overlay?: Record<string, unknown> }
} {
  if (!json) return {}
  return JSON.parse(json) as ReturnType<typeof parseJson>
}

function jsonHasSentinel(json: string | undefined): boolean {
  return Boolean(json?.includes(SPONSOR_CONTACT_UNSELECTED_VALUE))
}

function saveBody(
  existing: Program,
  values: ReturnType<typeof programToGeneralCommonInfoEditValues>,
  changedFormKeys: ReadonlySet<string>
) {
  const save = createGeneralProgramCommonInfoIndependentSave({
    values,
    program: existing,
    changedFormKeys,
  })
  const body = mapGeneralProgramToUpdateRequest(
    save.programDraft,
    save.patch,
    existing,
    save.serializeOptions
  )
  return { save, body, parsed: parseJson(body.serviceDetailJson) }
}

describe('GENERAL_SPONSOR_PATCH', () => {
  it('판정 상수는 FE_READY 이다', () => {
    expect(GENERAL_SPONSOR_PATCH_STATUS).toBe('GENERAL_SPONSOR_PATCH_FE_READY')
  })

  it('SP-FE-01 후원사 3개·담당자 3명 → 후원사 1개·담당자 0명', () => {
    const existing = threeSponsorProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body, parsed } = saveBody(
      existing,
      {
        ...values,
        sponsorManagementIds: ['1627251'],
        sponsorManagerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        sponsorManagerContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
      },
      new Set(['sponsorManagementIds', 'sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(body.sponsors).toEqual([{ sponsorId: '1627251', sponsorContactIds: [] }])
    expect(body).not.toHaveProperty('sponsorId')
    expect(parsed.generalCommonInfo?.sponsorManagementIds).toEqual(['1627251'])
    expect(parsed.generalCommonInfo?.sponsorManagerContactIds).toEqual([])
    expect(parsed.generalCommonInfo).not.toHaveProperty('sponsorManagerContactNames')
    expect(jsonHasSentinel(body.serviceDetailJson)).toBe(false)
  })

  it('SP-FE-02 담당자 미선택 sentinel 은 wire·JSON 에 없다', () => {
    const existing = threeSponsorProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body } = saveBody(
      existing,
      {
        ...values,
        sponsorManagerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        sponsorManagerContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
      },
      new Set(['sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(body.sponsors).toEqual([
      { sponsorId: '1627251', sponsorContactIds: [] },
      { sponsorId: '163301', sponsorContactIds: [] },
      { sponsorId: '163388', sponsorContactIds: [] },
    ])
    expect(jsonHasSentinel(body.serviceDetailJson)).toBe(false)
    expect(JSON.stringify(body.sponsors)).not.toContain(SPONSOR_CONTACT_UNSELECTED_VALUE)
  })

  it('SP-FE-03 후원사 미변경이면 sponsors·sponsorId 를 omit 한다', () => {
    const existing = threeSponsorProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body, parsed } = saveBody(
      existing,
      { ...values, announcementTitle: '제목만' },
      new Set(['announcementTitle'])
    )
    expect(body).not.toHaveProperty('sponsors')
    expect(body).not.toHaveProperty('sponsorId')
    expect(parsed.generalCommonInfo).not.toHaveProperty('sponsorManagementIds')
    expect(parsed.generalCommonInfo).not.toHaveProperty('sponsorManagerContactIds')
    expect(parsed.generalCommonInfo).not.toHaveProperty('sponsorManagerContactNames')
  })

  it('SP-FE-04 후원사 전체 삭제는 sponsors [] 이다', () => {
    const existing = threeSponsorProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body } = saveBody(
      existing,
      {
        ...values,
        sponsorManagementIds: [],
        sponsorManagerContactIds: [],
        sponsorManagerContactId: '',
      },
      new Set(['sponsorManagementIds', 'sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(body.sponsors).toEqual([])
    expect(body).not.toHaveProperty('sponsorId')
  })

  it('SP-FE-05 복수 담당자는 후원사별 원시 contact ID 만 보낸다', () => {
    const existing = threeSponsorProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body } = saveBody(
      existing,
      {
        ...values,
        sponsorManagementIds: ['1627251', '163301'],
        sponsorManagerContactIds: [
          '1627251::1627253',
          '1627251::1627254',
          '163301::163322',
        ],
        sponsorManagerContactId: '1627251::1627253',
      },
      new Set(['sponsorManagementIds', 'sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(body.sponsors).toEqual([
      { sponsorId: '1627251', sponsorContactIds: ['1627253', '1627254'] },
      { sponsorId: '163301', sponsorContactIds: ['163322'] },
    ])
    expect(JSON.stringify(body.sponsors)).not.toContain('::')
    expect(body.sponsors?.some(row => row.sponsorId === '163388')).toBe(false)
  })

  it('SP-FE-06 오래된 이름 map 은 선택값을 복원하지 않는다', () => {
    const existing = threeSponsorProgram()
    existing.generalCommonInfo = {
      ...existing.generalCommonInfo,
      sponsorManagerContactIds: [],
      sponsorManagerContactId: undefined,
      sponsorManagerLine: '미선택',
      sponsorManagerContactNames: {
        '1627251::999999': '과거담당자',
        '163301::888888': '과거담당자B',
      },
    }
    const values = programToGeneralCommonInfoEditValues(existing)
    expect(values.sponsorManagerContactIds).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(values.sponsorManagerContactIds).not.toContain('1627251::999999')
    const merged = mergeProgramSponsorAssignments(existing, [
      { sponsorId: '1627251', sponsorName: '후원사A', sponsorContacts: [] },
    ])
    const reseed = programToGeneralCommonInfoEditValues(merged)
    expect(reseed.sponsorManagementIds).toEqual(['1627251'])
    expect(reseed.sponsorManagerContactIds).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
  })

  it('SP-FE-07 후원사만 변경하면 정산 필드를 보내지 않는다', () => {
    const existing = threeSponsorProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { body, parsed } = saveBody(
      existing,
      {
        ...values,
        sponsorManagementIds: ['1627251'],
        sponsorManagerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        sponsorManagerContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
      },
      new Set(['sponsorManagementIds', 'sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(body).not.toHaveProperty('paymentItems')
    expect(body).not.toHaveProperty('wagePolicies')
    expect(parsed.generalCommonInfo).not.toHaveProperty('paymentItems')
    expect(parsed.generalCommonInfo).not.toHaveProperty('wageGradeRows')
    const overlay = parsed.registrationOverlay ?? parsed.registration?.overlay ?? {}
    expect(
      Object.keys(overlay).some(key => key.startsWith('generalRegistration.wageInfo.'))
    ).toBe(false)
  })

  it('SP-FE-08 후원사만 변경하면 교육 세션·일정을 재전송하지 않는다', () => {
    const existing = threeSponsorProgram()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { parsed } = saveBody(
      existing,
      {
        ...values,
        sponsorManagementIds: ['1627251'],
        sponsorManagerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        sponsorManagerContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
      },
      new Set(['sponsorManagementIds', 'sponsorManagerContactIds', 'sponsorManagerContactId'])
    )
    expect(parsed.generalCommonInfo).not.toHaveProperty('curriculumSessions')
    expect(parsed.generalCommonInfo).not.toHaveProperty('scheduleDetails')
    expect(parsed.generalCommonInfo).not.toHaveProperty('educationScheduleLines')
  })

  it('SP-FE-12 재조회 후 재편집 상태는 assignment 정본과 일치한다', () => {
    const existing = threeSponsorProgram()
    const merged = mergeProgramSponsorAssignments(existing, [
      {
        sponsorId: '1627251',
        sponsorName: '후원사A',
        sponsorContacts: [],
      },
    ])
    const values = programToGeneralCommonInfoEditValues(merged)
    expect(values.sponsorManagementIds).toEqual(['1627251'])
    expect(values.sponsorManagerContactIds).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    const { body } = saveBody(
      merged,
      { ...values, announcementTitle: '재편집' },
      new Set(['announcementTitle'])
    )
    expect(body).not.toHaveProperty('sponsors')
  })

  it('SP-FE-13 등록 위저드는 미선택 sentinel 을 유효 선택으로 유지한다', () => {
    const overlay = {
      'generalRegistration.basicInfo.programTitleEn': 'Test Program',
      'generalRegistration.basicInfo.publicProgramTitle': '공고용 프로그램',
      'generalRegistration.basicInfo.detailedProgramId': '163001',
      'generalRegistration.basicInfo.operationRangeSeal': {
        start: '2026-03-01T00:00:00.000Z',
        end: '2026-12-31T00:00:00.000Z',
      },
      'generalRegistration.basicInfo.businessField': 'economy',
      'generalRegistration.basicInfo.educationVenueDetail': '본관 3층',
      'generalRegistration.basicInfo.surveyItems': {
        survey: true,
        satisfaction: false,
        lecture_evaluation: false,
      },
      'generalRegistration.basicInfo.educationCourse': 'ja',
      'generalRegistration.basicInfo.ipOwned': 'ja',
      'generalRegistration.basicInfo.courseDeliveredBy': 'ja',
      'generalRegistration.kpi.participantCount': 10,
      'generalRegistration.wageInfo.grade1Fee': 100000,
      'generalRegistration.wageInfo.grade2Fee': 80000,
      'generalRegistration.wageInfo.grade3Fee': 60000,
      'generalRegistration.wageInfo.paymentItemValues': ['instructor_fee'],
      'generalRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
      'generalRegistration.educationCurriculum.unitNameBySession': { 1: '단원 1' },
      'generalRegistration.educationCurriculum.unitContentBySession': { 1: '교육 내용' },
      'generalRegistration.educationScheduleSettings.scheduleLines': ['2026-04-01 10:00-12:00'],
    }
    const ctx: GeneralProgramRegistrationRequiredFieldContext = {
      participant: {
        individual: true,
        organization: false,
        teacherInstructor: false,
        volunteer: false,
      },
      programType: 'curriculum',
      sessionRoundType: 'single',
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      curriculumSessionCount: 1,
      curriculumChartSessionCount: 1,
      scheduleCurriculumDetailCount: 1,
      scheduleCurriculumGroupCount: 1,
      scheduleCurriculumPreEducation: false,
      educationScheduleMode: 'date',
      sponsorId: 'sponsor-1',
      sponsorContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
      programTitleKo: '테스트 프로그램',
    }
    expect(hasIncompleteGeneralProgramRegistrationRequiredFields(overlay, ctx)).toBe(false)
    expect(
      hasIncompleteGeneralProgramRegistrationRequiredFields(overlay, {
        ...ctx,
        sponsorContactId: '',
      })
    ).toBe(true)
  })

  it('SP-FE-14 UJAT·1사1교 단수 DTO 는 sponsorId 를 유지한다', () => {
    const ujat = mapUjatToUpdateRequest(
      {
        id: 'ujat-1',
        sponsorId: '163388',
        title: 'UJAT',
        type: 'offline',
        format: 'course',
        category: 'school',
        rounds: [],
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        status: 'active',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        generalCommonInfo: { sponsorManagerContactIds: ['1627253'] },
      } as Program,
      {
        sponsorId: '163388',
        generalCommonInfo: { sponsorManagerContactIds: ['1627253'] },
      }
    )
    expect(ujat.sponsors).toEqual([{ sponsorId: '163388', sponsorContactId: '1627253' }])

    const companySchool = mapCompanySchoolToUpdateRequest(
      {
        id: 'cs-1',
        sponsorId: '163388',
        title: '1사1교',
        type: 'offline',
        format: 'workshop',
        category: 'school',
        description: '',
        rounds: [],
        startDate: '2026-01-01T00:00:00.000Z',
        endDate: '2026-12-31T00:00:00.000Z',
        status: 'pending',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        generalCommonInfo: { sponsorManagerContactIds: ['1627253'] },
      } as Program,
      {
        sponsorId: '163388',
        generalCommonInfo: { sponsorManagerContactIds: ['1627253'] },
      }
    )
    expect(companySchool.sponsorId).toBe('163388')
    expect(companySchool.sponsors).toEqual([
      { sponsorId: '163388', sponsorContactId: '1627253' },
    ])
  })

  it('Create 경로는 레거시 sponsorId 를 유지한다', () => {
    const request = mapGeneralProgramToCreateRequest(threeSponsorProgram())
    expect(request.sponsorId).toBe('1627251')
    expect(request.sponsors?.[0]?.sponsorId).toBe('1627251')
  })
})
