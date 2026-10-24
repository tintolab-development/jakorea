/** @vitest-environment node */
import { describe, expect, it, vi } from 'vitest'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import {
  parseGeneralProgramServiceDetailJson,
  serializeGeneralProgramServiceDetailJson,
  toKstDateKey,
} from '@/features/program/general/lib/general-program-service-detail-json'
import { buildGeneralProgramCreateFromWizardRhf } from '@/features/program/general/lib/overlay-phase1/build-registration-create-from-rhf'
import {
  createDefaultRegistrationWizardUiValues,
  type RegistrationWizardUiValues,
} from '@/features/program/general/lib/overlay-phase1/registration-wizard-ui-values'
import type { Program } from '@/types/domain'

const CMS_SLOT = '2026.11.06(금) 10:00 ~ 12:00'
const CMS_SLOT_LATER = '2026.11.06(금) 13:00 ~ 15:00'
const SERVER_SLOT = '26년 11월 6일(금) 10:00 ~ 12:00'
const SERVER_SLOT_LATER = '26년 11월 6일(금) 13:00 ~ 15:00'
const SCHEDULE_KEY = 'generalRegistration.educationScheduleSettings.scheduleLines'

function individualFixedDateValues(): RegistrationWizardUiValues {
  const values = createDefaultRegistrationWizardUiValues({
    programType: 'curriculum',
    sessionRoundType: 'single',
    curriculumChartSessionCount: 1,
    educationScheduleMode: 'date',
    participant: {
      individual: true,
      organization: false,
      teacherInstructor: false,
      volunteer: false,
    },
  })
  return {
    ...values,
    programTitleKo: '일정 계약 프로그램',
    programTitleEn: 'Schedule Contract',
    publicProgramTitle: '일정 계약 공고',
    detailedProgramId: '163006',
    detailedProgramName: '세부',
    businessField: 'career_employment',
    educationCourse: 'elementary',
    ipOwned: 'yes',
    courseDeliveredBy: 'ja',
    operationRangeSeal: { start: '2026-11-01', end: '2026-11-30' },
    sponsorId: '163001',
    sponsorIds: ['163001'],
    managerContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
    managerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
    kpiParticipantCount: 10,
    wageGrade1Fee: 180000,
    wageGrade2Fee: 100000,
    wageGrade3Fee: 80000,
    paymentItemValues: ['traffic'],
    ipsType: { category: 'prepare', detail: 'none' },
    scheduleLines: [CMS_SLOT, CMS_SLOT_LATER],
    singleDateIso: '2026-11-06',
    curriculum: {
      ...values.curriculum,
      unitNameBySession: { 1: '단원1' },
      unitContentBySession: { 1: '본문1' },
    },
  }
}

function serviceDetail(json: string | undefined): {
  generalCommonInfo?: { educationScheduleLines?: string[] }
  registrationOverlay?: Record<string, unknown>
  registration?: { overlay?: Record<string, unknown> }
  program?: { generalCommonInfo?: { educationScheduleLines?: string[] }; targetLevels?: unknown }
  startDate?: unknown
  businessStartDate?: unknown
} {
  return JSON.parse(json ?? '{}') as ReturnType<typeof serviceDetail>
}

/** JABACK parseSlot이 인식하는 같은 날 시각 줄만 물리 슬롯 id로 본다. */
function mockParseSlot(line: string): string | null {
  return /^\d{2}년 \d{1,2}월 \d{1,2}일\([일월화수목금토]\) \d{1,2}:\d{2} ~ \d{1,2}:\d{2}$/.test(
    line.trim()
  )
    ? `slot:${line.trim()}`
    : null
}

describe('교육 예정일 CMS·서버 계약', () => {
  it('CREATE payload만 서버 형식이고 RHF 프로그램·fetch는 그대로다', () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'local-general-schedule-contract',
      uiValues: individualFixedDateValues(),
    })
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(created.program.id).not.toBe('186313')
    expect(created.program.generalCommonInfo?.educationScheduleLines).toEqual([
      CMS_SLOT,
      CMS_SLOT_LATER,
    ])
    expect(created.persistOverlay[SCHEDULE_KEY]).toEqual([CMS_SLOT, CMS_SLOT_LATER])

    const request = created.createRequest as {
      serviceDetailJson?: string
      businessStartDate?: string
      businessEndDate?: string
      programType?: string
    }
    expect(request.programType).toBe('GENERAL_INDIVIDUAL')
    expect(toKstDateKey(request.businessStartDate)).toBe('2026-11-01')
    expect(toKstDateKey(request.businessEndDate)).toBe('2026-11-30')
    expect(request.businessStartDate).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(request.businessStartDate).not.toContain('년')

    const detail = serviceDetail(request.serviceDetailJson)
    expect(detail.generalCommonInfo?.educationScheduleLines).toEqual([SERVER_SLOT, SERVER_SLOT_LATER])
    expect(detail.registrationOverlay?.[SCHEDULE_KEY]).toEqual([SERVER_SLOT, SERVER_SLOT_LATER])
    expect(detail.registration?.overlay?.[SCHEDULE_KEY]).toEqual([SERVER_SLOT, SERVER_SLOT_LATER])
    expect(detail.program?.generalCommonInfo).toBeUndefined()
    expect(mockParseSlot(CMS_SLOT)).toBeNull()
    expect(detail.generalCommonInfo?.educationScheduleLines?.map(mockParseSlot)).toEqual([
      `slot:${SERVER_SLOT}`,
      `slot:${SERVER_SLOT_LATER}`,
    ])
    vi.unstubAllGlobals()
  })

  it('PATCH는 같은 직렬화를 쓰고, 제목만 수정하면 교육 예정일을 다시 쓰지 않는다', () => {
    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'local-general-schedule-patch',
      uiValues: individualFixedDateValues(),
    })
    const patched = mapGeneralProgramToUpdateRequest(
      created.program,
      { generalCommonInfo: created.program.generalCommonInfo },
      created.program
    )
    const detail = serviceDetail(patched.serviceDetailJson)
    expect(detail.generalCommonInfo?.educationScheduleLines).toEqual([SERVER_SLOT, SERVER_SLOT_LATER])
    expect(detail.registration?.overlay?.[SCHEDULE_KEY]).toEqual([SERVER_SLOT, SERVER_SLOT_LATER])

    const titleOnly = mapGeneralProgramToUpdateRequest(
      created.program,
      { title: '제목만' },
      created.program
    )
    expect(titleOnly.serviceDetailJson).toBeUndefined()
    expect(created.program.generalCommonInfo?.educationScheduleLines).toEqual([
      CMS_SLOT,
      CMS_SLOT_LATER,
    ])
  })

  it('GET 복원 뒤 다시 저장해도 서버 문자열이 같다', () => {
    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'local-general-schedule-roundtrip',
      uiValues: individualFixedDateValues(),
    })
    const first = serviceDetail(created.createRequest.serviceDetailJson)
    const restored = parseGeneralProgramServiceDetailJson(created.createRequest.serviceDetailJson)
    expect(restored.generalCommonInfo?.educationScheduleLines).toEqual([CMS_SLOT, CMS_SLOT_LATER])
    expect(restored.registrationOverlay?.[SCHEDULE_KEY]).toEqual([CMS_SLOT, CMS_SLOT_LATER])

    const again = serializeGeneralProgramServiceDetailJson({
      ...created.program,
      generalCommonInfo: restored.generalCommonInfo,
      registrationOverlay: restored.registrationOverlay,
    })
    expect(serviceDetail(again).generalCommonInfo?.educationScheduleLines).toEqual(
      first.generalCommonInfo?.educationScheduleLines
    )
  })

  it('요일 없는 경제 기간과 자유입력은 서버 형식으로 바꾸지 않는다', () => {
    const economy = '2026.03.01 ~ 2026.12.31'
    const json = serializeGeneralProgramServiceDetailJson({
      id: 'local-economy',
      title: '경제',
      mainTitle: '경제',
      type: 'offline',
      format: 'workshop',
      category: 'school',
      startDate: '2026-03-01',
      endDate: '2026-12-31',
      status: 'pending',
      sponsorId: '1',
      rounds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      generalCommonInfo: {
        educationScheduleLines: [economy, '협의 후 확정'],
      },
    } as unknown as Program)
    expect(serviceDetail(json).generalCommonInfo?.educationScheduleLines).toEqual([
      economy,
      '협의 후 확정',
    ])
    expect(json).not.toContain('26년 3월')
  })
})
