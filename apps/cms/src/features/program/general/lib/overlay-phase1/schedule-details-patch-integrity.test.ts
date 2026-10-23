/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import {
  programToGeneralCommonInfoEditValues,
  type GeneralProgramCommonInfoEditFormValues,
  type GeneralProgramScheduleDetailFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  applySchedulePreEducationBlock,
  PRE_EDUCATION_SCHEDULE_LABEL,
} from '@/features/program/general/lib/schedule-detail-form'
import { createGeneralProgramCommonInfoIndependentSave } from './common-info-independent-save'
import { GENERAL_SCHEDULE_DETAILS_STATUS } from './general-detail-rhf-save-path'

const DETAIL_01_DATE = '2026.11.05(목) 10:00 ~ 12:00'
const DETAIL_02_DATE = '2026.11.12(목) 10:00 ~ 12:00'
const PRE_DATE = '2026.11.01(일) 09:00 ~ 10:00'
const TIME_SUMMARY = '13:30 ~ 15:30'
const DETAIL_01_NAME = '필요와 욕구, 현명한 소비'
const DETAIL_02_NAME = '저축 목표 세우기'

function organizationProgram186309(overrides?: {
  preEducation?: boolean
  secondDetail?: boolean
  educationScheduleMode?: 'date' | 'period'
}): Program {
  const preEducation = overrides?.preEducation ?? true
  const secondDetail = overrides?.secondDetail ?? true
  const educationScheduleMode = overrides?.educationScheduleMode ?? 'period'
  const now = '2026-10-22T00:00:00.000Z'
  const scheduleDetails: NonNullable<Program['generalCommonInfo']>['scheduleDetails'] = []
  if (preEducation) {
    scheduleDetails.push({
      scheduleLabel: PRE_EDUCATION_SCHEDULE_LABEL,
      name: PRE_EDUCATION_SCHEDULE_LABEL,
      scheduleDateLabel: PRE_DATE,
    })
  }
  scheduleDetails.push({
    scheduleLabel: '세부 일정 01',
    name: DETAIL_01_NAME,
    scheduleDateLabel: DETAIL_01_DATE,
    progressTimeSummary: TIME_SUMMARY,
  })
  if (secondDetail) {
    scheduleDetails.push({
      scheduleLabel: '세부 일정 02',
      name: DETAIL_02_NAME,
      scheduleDateLabel: DETAIL_02_DATE,
      progressTimeSummary: TIME_SUMMARY,
    })
  }
  return {
    id: '186309',
    sponsorId: '1627251',
    title: '기관일정기간지정',
    mainTitle: '기관일정기간지정',
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
    generalProgramEducationStructure: 'schedule',
    generalProgramSessionRound: 'single',
    generalParticipantTypes: ['school_institution'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      venueKind: 'inside',
      venueDetail: '서울시 강남구',
      sponsorManagementIds: ['1627251'],
      educationScheduleMode,
      educationScheduleLines:
        educationScheduleMode === 'period'
          ? ['2026.11.01(일) ~ 2026.11.30(월)']
          : ['2026.11.05(목) 10:00 ~ 12:00'],
      scheduleCurriculumPreEducation: preEducation,
      scheduleDetails,
      wageGradeRows: [{ grade: '1급 강사비', pricing: '1시간 당 | 기본 : 140,000원' }],
      paymentItems: '교통비',
    },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parseJson(json: string | undefined): {
  generalCommonInfo?: Record<string, unknown>
} {
  if (!json) return {}
  return JSON.parse(json) as ReturnType<typeof parseJson>
}

function saveBody(
  existing: Program,
  values: GeneralProgramCommonInfoEditFormValues,
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

function jsonScheduleDetails(parsed: { generalCommonInfo?: Record<string, unknown> }) {
  return (parsed.generalCommonInfo?.scheduleDetails ?? undefined) as
    | Array<{
        scheduleLabel?: string
        name?: string
        scheduleDateLabel?: string
        progressTimeSummary?: string
      }>
    | undefined
}

function regularDetails(values: GeneralProgramCommonInfoEditFormValues) {
  return values.scheduleDetails.filter(row => row.blockKind !== 'preEducation')
}

function emptySubDetail(label: string): GeneralProgramScheduleDetailFormValues {
  return {
    scheduleLabel: label,
    blockKind: 'sub',
    name: '새 세부 일정',
    groupTimes: [{ startTime: '10:00', endTime: '12:00' }],
    scheduleDate: '',
    assignmentEnabled: false,
    assignmentPeriod: '',
    educationForm: 'offline',
    participationMethod: 'individual',
    ipsCategory: 'prepare',
    ipsDetail: 'none',
  }
}

describe('GENERAL_SCHEDULE_DETAILS', () => {
  it('판정 상수는 FE_READY 이다', () => {
    expect(GENERAL_SCHEDULE_DETAILS_STATUS).toBe('GENERAL_SCHEDULE_DETAILS_FE_READY')
  })

  it('SCH-FE-01 제목만 변경하면 scheduleDetails를 omit한다', () => {
    const existing = organizationProgram186309()
    const values = programToGeneralCommonInfoEditValues(existing)
    expect(values.scheduleDetails.find(row => row.name === DETAIL_01_NAME)?.scheduleDate).toBe(
      DETAIL_01_DATE
    )
    const { save, parsed } = saveBody(
      existing,
      { ...values, announcementTitle: '제목만 수정', mainTitle: '제목만 수정' },
      new Set(['announcementTitle', 'mainTitle'])
    )
    expect(save.patch.generalCommonInfo).not.toHaveProperty('scheduleDetails')
    expect(parsed.generalCommonInfo).not.toHaveProperty('scheduleDetails')
  })

  it('SCH-FE-02 교육명만 변경하면 기존 날짜·시간을 유지한다', () => {
    const existing = organizationProgram186309()
    const values = programToGeneralCommonInfoEditValues(existing)
    const nextDetails = values.scheduleDetails.map(row =>
      row.name === DETAIL_01_NAME ? { ...row, name: '수정된 교육명' } : row
    )
    const { parsed, body } = saveBody(
      existing,
      { ...values, scheduleDetails: nextDetails },
      new Set(['scheduleDetails'])
    )
    const details = jsonScheduleDetails(parsed)
    const updated = details?.find(row => row.name === '수정된 교육명')
    expect(updated?.scheduleDateLabel).toBe(DETAIL_01_DATE)
    expect(updated?.progressTimeSummary).toBe(TIME_SUMMARY)
    const other = details?.find(row => row.name === DETAIL_02_NAME)
    expect(other?.scheduleDateLabel).toBe(DETAIL_02_DATE)
    expect(other?.progressTimeSummary).toBe(TIME_SUMMARY)
    expect(body).not.toHaveProperty('sponsors')
    expect(body).not.toHaveProperty('wagePolicies')
  })

  it('SCH-FE-03 진행 시간만 변경하면 기존 교육명·날짜를 유지한다', () => {
    const existing = organizationProgram186309()
    const values = programToGeneralCommonInfoEditValues(existing)
    const nextDetails = values.scheduleDetails.map(row =>
      row.name === DETAIL_01_NAME
        ? { ...row, groupTimes: [{ startTime: '14:00', endTime: '16:00' }] }
        : row
    )
    const { parsed } = saveBody(
      existing,
      { ...values, scheduleDetails: nextDetails },
      new Set(['scheduleDetails'])
    )
    const updated = jsonScheduleDetails(parsed)?.find(row => row.name === DETAIL_01_NAME)
    expect(updated?.scheduleDateLabel).toBe(DETAIL_01_DATE)
    expect(updated?.progressTimeSummary).toBe('14:00 ~ 16:00')
  })

  it('SCH-FE-04 사전교육을 추가해도 기존 세부 일정의 날짜·시간을 보존한다', () => {
    const existing = organizationProgram186309({ preEducation: false })
    const values = programToGeneralCommonInfoEditValues(existing)
    const nextDetails = applySchedulePreEducationBlock(values.scheduleDetails, true, {
      groupCount: values.scheduleGroupCount,
    })
    const { parsed } = saveBody(
      existing,
      {
        ...values,
        scheduleCurriculumPreEducation: true,
        scheduleDetails: nextDetails,
      },
      new Set(['scheduleCurriculumPreEducation', 'scheduleDetails'])
    )
    const details = jsonScheduleDetails(parsed)
    expect(details?.[0]?.scheduleLabel).toBe(PRE_EDUCATION_SCHEDULE_LABEL)
    const kept = details?.find(row => row.name === DETAIL_01_NAME)
    expect(kept?.scheduleDateLabel).toBe(DETAIL_01_DATE)
    expect(kept?.progressTimeSummary).toBe(TIME_SUMMARY)
  })

  it('SCH-FE-05 사전교육을 제거해도 일반 세부 일정을 보존한다', () => {
    const existing = organizationProgram186309({ preEducation: true })
    const values = programToGeneralCommonInfoEditValues(existing)
    const nextDetails = applySchedulePreEducationBlock(values.scheduleDetails, false, {
      groupCount: values.scheduleGroupCount,
    })
    const { parsed } = saveBody(
      existing,
      {
        ...values,
        scheduleCurriculumPreEducation: false,
        scheduleDetails: nextDetails,
      },
      new Set(['scheduleCurriculumPreEducation', 'scheduleDetails'])
    )
    const details = jsonScheduleDetails(parsed)
    expect(details?.some(row => row.scheduleLabel === PRE_EDUCATION_SCHEDULE_LABEL)).toBe(false)
    expect(details?.find(row => row.name === DETAIL_01_NAME)?.scheduleDateLabel).toBe(DETAIL_01_DATE)
    expect(details?.find(row => row.name === DETAIL_02_NAME)?.scheduleDateLabel).toBe(DETAIL_02_DATE)
  })

  it('SCH-FE-06 세부 일정을 추가해도 기존 항목 필드를 유지한다', () => {
    const existing = organizationProgram186309()
    const values = programToGeneralCommonInfoEditValues(existing)
    const { parsed } = saveBody(
      existing,
      {
        ...values,
        scheduleDetails: [...values.scheduleDetails, emptySubDetail('세부 일정 03')],
      },
      new Set(['scheduleDetails'])
    )
    const details = jsonScheduleDetails(parsed)
    expect(details?.find(row => row.name === DETAIL_01_NAME)?.scheduleDateLabel).toBe(DETAIL_01_DATE)
    expect(details?.some(row => row.name === '새 세부 일정')).toBe(true)
  })

  it('SCH-FE-07 세부 일정을 삭제하면 해당 항목만 제거한다', () => {
    const existing = organizationProgram186309()
    const values = programToGeneralCommonInfoEditValues(existing)
    const nextDetails = values.scheduleDetails.filter(row => row.name !== DETAIL_02_NAME)
    const { parsed } = saveBody(
      existing,
      { ...values, scheduleDetails: nextDetails },
      new Set(['scheduleDetails'])
    )
    const details = jsonScheduleDetails(parsed)
    expect(details?.some(row => row.name === DETAIL_02_NAME)).toBe(false)
    expect(details?.find(row => row.name === DETAIL_01_NAME)?.scheduleDateLabel).toBe(DETAIL_01_DATE)
  })

  it('SCH-FE-08 일정 순서를 바꿔도 다른 행 데이터가 섞이지 않는다', () => {
    const existing = organizationProgram186309()
    const values = programToGeneralCommonInfoEditValues(existing)
    const pre = values.scheduleDetails.filter(row => row.blockKind === 'preEducation')
    const regular = regularDetails(values)
    const { parsed } = saveBody(
      existing,
      { ...values, scheduleDetails: [...pre, ...regular.slice().reverse()] },
      new Set(['scheduleDetails'])
    )
    const details = jsonScheduleDetails(parsed)
    expect(details?.find(row => row.name === DETAIL_01_NAME)?.scheduleDateLabel).toBe(DETAIL_01_DATE)
    expect(details?.find(row => row.name === DETAIL_02_NAME)?.scheduleDateLabel).toBe(DETAIL_02_DATE)
  })

  it('SCH-FE-09 DATE → PERIOD 전환 시 세부 일정 DATE 전용 라벨은 정리한다', () => {
    const existing = organizationProgram186309({
      preEducation: false,
      secondDetail: false,
      educationScheduleMode: 'date',
    })
    const values = programToGeneralCommonInfoEditValues(existing)
    const { parsed } = saveBody(
      existing,
      {
        ...values,
        educationScheduleMode: 'period',
        educationScheduleLines: ['2026.11.01(일) ~ 2026.11.30(월)'],
      },
      new Set(['educationScheduleMode', 'educationScheduleLines'])
    )
    const details = jsonScheduleDetails(parsed)
    expect(details?.[0]?.name).toBe(DETAIL_01_NAME)
    expect(details?.[0]?.progressTimeSummary).toBe(TIME_SUMMARY)
    expect(details?.[0]?.scheduleDateLabel).toBeUndefined()
  })

  it('SCH-FE-10 PERIOD → DATE 전환 시 날짜는 educationScheduleLines로 저장한다', () => {
    const existing = organizationProgram186309({
      preEducation: false,
      secondDetail: false,
      educationScheduleMode: 'period',
    })
    const values = programToGeneralCommonInfoEditValues(existing)
    const dateLine = '2026.11.05(목) 10:00 ~ 12:00'
    const { parsed } = saveBody(
      existing,
      {
        ...values,
        educationScheduleMode: 'date',
        educationScheduleLines: [dateLine],
      },
      new Set(['educationScheduleMode', 'educationScheduleLines'])
    )
    expect(parsed.generalCommonInfo?.educationScheduleMode).toBe('date')
    expect(parsed.generalCommonInfo?.educationScheduleLines).toEqual([dateLine])
    const details = jsonScheduleDetails(parsed)
    expect(details?.[0]?.progressTimeSummary).toBe(TIME_SUMMARY)
    expect(details?.[0]?.scheduleDateLabel).toBeUndefined()
  })

  it('SCH-FE-11 저장 후 GET 재진입 Mock에서 날짜·시간이 남는다', () => {
    const existing = organizationProgram186309()
    const values = programToGeneralCommonInfoEditValues(existing)
    const nextDetails = values.scheduleDetails.map(row =>
      row.name === DETAIL_01_NAME ? { ...row, name: '수정된 교육명' } : row
    )
    const { parsed } = saveBody(
      existing,
      { ...values, scheduleDetails: nextDetails },
      new Set(['scheduleDetails'])
    )
    const merged: Program = {
      ...existing,
      generalCommonInfo: {
        ...existing.generalCommonInfo,
        ...(parsed.generalCommonInfo as Program['generalCommonInfo']),
      },
    }
    const reseed = programToGeneralCommonInfoEditValues(merged)
    const row = reseed.scheduleDetails.find(item => item.name === '수정된 교육명')
    expect(row?.scheduleDate).toBe(DETAIL_01_DATE)
    expect(row?.groupTimes[0]?.startTime).toBe('13:30')
    expect(row?.groupTimes[0]?.endTime).toBe('15:30')
  })

  it('SCH-FE-12 일정 교육명 변경은 후원사·정산 키를 추가하지 않는다', () => {
    const existing = organizationProgram186309()
    const values = programToGeneralCommonInfoEditValues(existing)
    const nextDetails = values.scheduleDetails.map(row =>
      row.name === DETAIL_01_NAME ? { ...row, name: '수정된 교육명' } : row
    )
    const { body, parsed } = saveBody(
      existing,
      { ...values, scheduleDetails: nextDetails },
      new Set(['scheduleDetails'])
    )
    expect(body).not.toHaveProperty('sponsors')
    expect(body).not.toHaveProperty('sponsorId')
    expect(body).not.toHaveProperty('wagePolicies')
    expect(parsed.generalCommonInfo).not.toHaveProperty('wageGradeRows')
    expect(parsed.generalCommonInfo).not.toHaveProperty('paymentItems')
  })
})
