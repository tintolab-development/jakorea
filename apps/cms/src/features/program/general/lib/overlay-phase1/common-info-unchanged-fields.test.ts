/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  generalCommonInfoEditValuesToProgramPatch,
  programToGeneralCommonInfoEditValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { mapGeneralProgramToUpdateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { parseWageGradeAmount } from '@/features/program/general/lib/wage-display'
import { createGeneralProgramCommonInfoIndependentSave } from './common-info-independent-save'
import { GENERAL_DETAIL_UNCHANGED_FIELDS_STATUS } from './general-detail-rhf-save-path'

/**
 * 186307 GET 재현 형상 (읽기 전용 증거).
 * PATCH는 mock transport만 사용한다.
 */
const GET_WAGE_ROWS = [
  { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 140,000원' },
  { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원' },
  { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 100,000원' },
] as const

const GET_OVERLAY_186307 = {
  'generalRegistration.basicInfo.detailedProgramName': '기존 세부프로그램',
  'generalRegistration.basicInfo.educationVenueDetail': '서울시 강남구',
  'generalRegistration.basicInfo.localManagerContactId': 'contact-1',
  'generalRegistration.basicInfo.localManagerContactIds': ['contact-1'],
  'generalRegistration.educationScheduleSettings.scheduleLines': [
    '26년 4월 1일(수) 10:00 ~ 12:00',
  ],
  'generalRegistration.kpi.participantCount': 80,
  'generalRegistration.typeSettings.educationForm': 'offline',
  'generalRegistration.typeSettings.singleEducationForm': 'offline',
  'generalRegistration.typeSettings.multiCommonEducationForm': 'offline',
} as const

function getProgram186307(): Program {
  const now = '2026-10-21T00:00:00.000Z'
  return {
    id: '186307',
    sponsorId: '163302',
    title: '개인프로그램기본정보수정',
    mainTitle: '개인프로그램기본정보수정',
    titleEn: 'Digital Literacy Classroom',
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
    generalProgramAudience: 'individual',
    generalProgramEducationStructure: 'curriculum',
    generalProgramSessionRound: 'single',
    generalParticipantTypes: ['individual'],
    generalCommonInfo: {
      announcementTitle: '기존 공고',
      detailedProgramName: '기존 세부프로그램',
      venueKind: 'inside',
      venueDetail: '서울시 강남구',
      sponsorManagementIds: ['163302'],
      sponsorManagerContactIds: ['contact-1'],
      educationScheduleLines: ['26년 4월 1일(수) 10:00 ~ 12:00'],
      educationFormLabel: '오프라인',
      participationMethod: 'individual',
      curriculumSessions: [
        { sessionNo: 1, sessionLabel: '1회차', title: '단원1', description: '본문1' },
        { sessionNo: 2, sessionLabel: '2회차', title: '단원2', description: '본문2' },
      ],
      scheduleDetails: [],
      wageGradeRows: [...GET_WAGE_ROWS],
      paymentItems: '교통비, 식사비',
      deductionItems: '일용근로자 원천징수세액',
      kpi: {
        finalParticipants: 80,
        instructorCount: 2,
        volunteerCount: 1,
        finalSchools: 0,
        finalClasses: 0,
      },
      participantRecruitmentInfo: { remarks: '모집 비고 유지' },
    },
    registrationOverlay: { ...GET_OVERLAY_186307 },
    rounds: [],
    createdAt: now,
    updatedAt: now,
  }
}

function parseJson(json: string | undefined): {
  generalCommonInfo?: Record<string, unknown>
  generalSurveyMenuKeys?: unknown
  registrationOverlay?: Record<string, unknown>
  registration?: { overlay?: Record<string, unknown> }
} {
  if (!json) return {}
  return JSON.parse(json) as ReturnType<typeof parseJson>
}

function hasOwn(record: Record<string, unknown> | undefined, key: string): boolean {
  return record != null && Object.prototype.hasOwnProperty.call(record, key)
}

const GENERATED_DEFAULT_KEYS = [
  'educationFormLabel',
  'educationFormScheduleDetail',
  'participationScheduleDetail',
  'ipsScheduleDetail',
  'educationScheduleMode',
  'ipsTypeSummary',
  'participationMethod',
  'scheduleCurriculumPreEducation',
] as const

function wageAmountsFromRows(
  rows: Array<{ grade?: string; pricing?: string }> | undefined
): number[] {
  return (rows ?? [])
    .map(row => parseWageGradeAmount(row.pricing))
    .filter((n): n is number => n != null)
}

describe('미변경 공통정보 PATCH 보존 — GET 186307 형상', () => {
  it('판정 상수는 READY 이다', () => {
    expect(GENERAL_DETAIL_UNCHANGED_FIELDS_STATUS).toBe('GENERAL_DETAIL_UNCHANGED_FIELDS_READY')
  })

  it('GET → RHF 시드가 140000/120000/100000이지 1이 아니다', () => {
    const values = programToGeneralCommonInfoEditValues(getProgram186307())
    expect(values.wageGrade1Amount).toBe('140000')
    expect(values.wageGrade2Amount).toBe('120000')
    expect(values.wageGrade3Amount).toBe('100000')
    expect(values.wageGrade1Amount).not.toBe('1')
    expect(values.curriculumSessions).toHaveLength(2)
    expect(values.kpiFinalParticipants).toBe(80)
  })

  it('제목만 바꾸면 강사비·지급·회차·KPI를 재전송하지 않는다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, announcementTitle: '수정 공고', mainTitle: '수정 대표명' },
      program: existing,
      changedFormKeys: new Set(['announcementTitle', 'mainTitle']),
    })
    const common = save.patch.generalCommonInfo
    expect(common).not.toHaveProperty('wageGradeRows')
    expect(common).not.toHaveProperty('paymentItems')
    expect(common).not.toHaveProperty('deductionItems')
    expect(common).not.toHaveProperty('curriculumSessions')
    expect(common).not.toHaveProperty('kpi')
    expect(common).not.toHaveProperty('participantRecruitmentInfo')
    for (const key of GENERATED_DEFAULT_KEYS) {
      expect(common).not.toHaveProperty(key)
    }

    const parsed = parseJson(
      mapGeneralProgramToUpdateRequest(
        save.programDraft,
        save.patch,
        existing,
        save.serializeOptions
      ).serviceDetailJson
    )
    expect(hasOwn(parsed.generalCommonInfo, 'wageGradeRows')).toBe(false)
    expect(hasOwn(parsed.generalCommonInfo, 'paymentItems')).toBe(false)
    expect(hasOwn(parsed.generalCommonInfo, 'curriculumSessions')).toBe(false)
    expect(hasOwn(parsed.generalCommonInfo, 'kpi')).toBe(false)
    expect(hasOwn(parsed.generalCommonInfo, 'participantRecruitmentInfo')).toBe(false)
    for (const key of GENERATED_DEFAULT_KEYS) {
      expect(hasOwn(parsed.generalCommonInfo, key)).toBe(false)
    }
    expect(parsed.generalCommonInfo?.announcementTitle).toBe('수정 공고')
  })

  it('쉼표 포함 금액을 같은 값으로 보면 강사비를 보내지 않는다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: {
        ...values,
        announcementTitle: '수정 공고',
        wageGrade1Amount: '140,000',
        wageGrade2Amount: '120,000',
        wageGrade3Amount: '100,000',
      },
      program: existing,
      changedFormKeys: new Set(['announcementTitle', 'wageGrade1Amount', 'wageGrade2Amount', 'wageGrade3Amount']),
    })
    expect(save.patch.generalCommonInfo).not.toHaveProperty('wageGradeRows')
    const parsed = parseJson(
      mapGeneralProgramToUpdateRequest(
        save.programDraft,
        save.patch,
        existing,
        save.serializeOptions
      ).serviceDetailJson
    )
    expect(hasOwn(parsed.generalCommonInfo, 'wageGradeRows')).toBe(false)
  })

  it('강사비를 실제로 수정하면 새 금액만 저장한다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, wageGrade1Amount: '150,000' },
      program: existing,
      changedFormKeys: new Set(['wageGrade1Amount']),
    })
    const rows = save.patch.generalCommonInfo?.wageGradeRows
    expect(wageAmountsFromRows(rows)).toEqual([150_000, 120_000, 100_000])
    const parsed = parseJson(
      mapGeneralProgramToUpdateRequest(
        save.programDraft,
        save.patch,
        existing,
        save.serializeOptions
      ).serviceDetailJson
    )
    const jsonRows = parsed.generalCommonInfo?.wageGradeRows as
      | Array<{ pricing?: string }>
      | undefined
    expect(wageAmountsFromRows(jsonRows)).toEqual([150_000, 120_000, 100_000])
  })

  it('GET → RHF → PATCH → GET 병합 왕복에서 미변경 강사비·회차·KPI가 남는다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, announcementTitle: '왕복 공고' },
      program: existing,
      changedFormKeys: new Set(['announcementTitle']),
    })
    const body = mapGeneralProgramToUpdateRequest(
      save.programDraft,
      save.patch,
      existing,
      save.serializeOptions
    )
    const parsed = parseJson(body.serviceDetailJson)
    const mergedCommon = {
      ...existing.generalCommonInfo,
      ...parsed.generalCommonInfo,
    }
    expect(wageAmountsFromRows(mergedCommon.wageGradeRows)).toEqual([140_000, 120_000, 100_000])
    expect(mergedCommon.curriculumSessions).toHaveLength(2)
    expect(mergedCommon.kpi?.finalParticipants).toBe(80)
    expect(mergedCommon.paymentItems).toBe('교통비, 식사비')
    expect(mergedCommon.announcementTitle).toBe('왕복 공고')

    const reseed = programToGeneralCommonInfoEditValues({
      ...existing,
      generalCommonInfo: mergedCommon,
    })
    expect(reseed.wageGrade1Amount).toBe('140000')
    expect(reseed.wageGrade2Amount).toBe('120000')
    expect(reseed.wageGrade3Amount).toBe('100000')
    expect(reseed.curriculumSessions).toHaveLength(2)
    expect(reseed.kpiFinalParticipants).toBe(80)
  })

  it('mapper가 강사비를 1원으로 만들지 않는다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const patch = generalCommonInfoEditValuesToProgramPatch(values, existing)
    expect(wageAmountsFromRows(patch.generalCommonInfo?.wageGradeRows)).toEqual([
      140_000, 120_000, 100_000,
    ])
  })

  it('제목만 수정한 Independent PATCH에 남는 키를 고정한다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, announcementTitle: '수정 공고' },
      program: existing,
      changedFormKeys: new Set(['announcementTitle']),
    })
    expect(Object.keys(save.patch).sort()).toEqual(['generalCommonInfo'])
    expect(Object.keys(save.patch.generalCommonInfo ?? {}).sort()).toEqual(['announcementTitle'])
  })

  it('legacy GET에 없는 자동 기본값은 최종 JSON에서도 생기지 않는다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, announcementTitle: 'legacy 제목만 수정' },
      program: existing,
      changedFormKeys: new Set(['announcementTitle']),
    })
    const parsed = parseJson(
      mapGeneralProgramToUpdateRequest(
        save.programDraft,
        save.patch,
        existing,
        save.serializeOptions
      ).serviceDetailJson
    )

    for (const key of GENERATED_DEFAULT_KEYS) {
      expect(save.patch.generalCommonInfo).not.toHaveProperty(key)
      expect(hasOwn(parsed.generalCommonInfo, key)).toBe(false)
    }
  })

  it('자동 기본값 대상 필드를 사용자가 실제 수정하면 전송한다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: {
        ...values,
        educationForm: 'online',
        educationFormScheduleDetail: 'perSchedule',
        participationScheduleDetail: 'common',
        ipsScheduleDetail: 'perSchedule',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
        participationMethod: 'team',
        educationScheduleMode: 'period',
        scheduleCurriculumPreEducation: true,
      },
      program: existing,
      changedFormKeys: new Set([
        'educationForm',
        'educationFormScheduleDetail',
        'participationScheduleDetail',
        'ipsScheduleDetail',
        'ipsCategory',
        'ipsDetail',
        'participationMethod',
        'educationScheduleMode',
        'scheduleCurriculumPreEducation',
      ]),
    })
    const common = save.patch.generalCommonInfo
    expect(common).toHaveProperty('educationFormScheduleDetail', 'perSchedule')
    expect(common).toHaveProperty('participationScheduleDetail', 'common')
    expect(common).toHaveProperty('ipsScheduleDetail', 'perSchedule')
    expect(common).toHaveProperty('ipsTypeSummary')
    expect(common).toHaveProperty('participationMethod', 'team')
    expect(common).toHaveProperty('educationScheduleMode', 'date')
    expect(common).toHaveProperty('scheduleCurriculumPreEducation', true)
  })

  it('제목만 수정하면 overlay 미변경 값을 빈값·기본 enum으로 덮지 않는다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: { ...values, announcementTitle: '수정 공고' },
      program: existing,
      changedFormKeys: new Set(['announcementTitle']),
    })
    const parsed = parseJson(
      mapGeneralProgramToUpdateRequest(
        save.programDraft,
        save.patch,
        existing,
        save.serializeOptions
      ).serviceDetailJson
    )
    const overlay = parsed.registrationOverlay ?? parsed.registration?.overlay
    expect(overlay?.['generalRegistration.basicInfo.detailedProgramName']).toBe('기존 세부프로그램')
    expect(overlay?.['generalRegistration.basicInfo.educationVenueDetail']).toBe('서울시 강남구')
    expect(overlay?.['generalRegistration.basicInfo.localManagerContactId']).toBe('contact-1')
    expect(overlay?.['generalRegistration.basicInfo.localManagerContactIds']).toEqual(['contact-1'])
    expect(overlay?.['generalRegistration.educationScheduleSettings.scheduleLines']).toEqual([
      '26년 4월 1일(수) 10:00 ~ 12:00',
    ])
    expect(overlay?.['generalRegistration.kpi.participantCount']).toBe(80)
    expect(overlay?.['generalRegistration.typeSettings.educationForm']).toBe('offline')
    expect(overlay?.['generalRegistration.typeSettings.singleEducationForm']).toBe('offline')
    expect(overlay?.['generalRegistration.typeSettings.multiCommonEducationForm']).toBe('offline')
  })

  it('실제 수정한 대표명·영문명·KPI·강사비·교육과정·IP는 PATCH에 남긴다', () => {
    const existing = getProgram186307()
    const values = programToGeneralCommonInfoEditValues(existing)
    const save = createGeneralProgramCommonInfoIndependentSave({
      values: {
        ...values,
        mainTitle: '프로그램 수정 테스트123',
        announcementTitle: '프로그램 수정 테스트456',
        titleEn: 'Digital Literacy Classroom789',
        kpiFinalParticipants: 510,
        wageGrade1Amount: '123',
        wageGrade2Amount: '456',
        wageGrade3Amount: '789',
        educationProcess: 'digital_computer',
        ipOwned: 'partner',
        curriculumSessions: values.curriculumSessions.map((row, index) =>
          index === 0 ? { ...row, title: '수정 단원', description: '수정 본문' } : row
        ),
      },
      program: existing,
      changedFormKeys: new Set([
        'mainTitle',
        'announcementTitle',
        'titleEn',
        'kpiFinalParticipants',
        'wageGrade1Amount',
        'wageGrade2Amount',
        'wageGrade3Amount',
        'educationProcess',
        'ipOwned',
        'curriculumSessions',
      ]),
    })
    expect(save.patch.title).toBe('프로그램 수정 테스트123')
    expect(save.patch.mainTitle).toBe('프로그램 수정 테스트123')
    expect(save.patch.titleEn).toBe('Digital Literacy Classroom789')
    expect(save.patch.educationProcess).toBe('Digital (Computer)')
    expect(save.patch.ipOwned).toBe('Partner')
    expect(save.patch.generalCommonInfo?.kpi?.finalParticipants).toBe(510)
    expect(wageAmountsFromRows(save.patch.generalCommonInfo?.wageGradeRows)).toEqual([123, 456, 789])
    expect(save.patch.generalCommonInfo?.curriculumSessions?.[0]).toMatchObject({
      title: '수정 단원',
      description: '수정 본문',
    })

    const body = mapGeneralProgramToUpdateRequest(
      save.programDraft,
      save.patch,
      existing,
      save.serializeOptions
    )
    expect(body.title).toBe('프로그램 수정 테스트123')
    expect(body.titleEn).toBe('Digital Literacy Classroom789')
    expect(body.educationProcess).toBe('Digital (Computer)')
    expect(body.ipOwned).toBe('Partner')
    expect(body.totalParticipants).toBe(510)
    const parsed = parseJson(body.serviceDetailJson)
    expect(parsed.generalCommonInfo?.announcementTitle).toBe('프로그램 수정 테스트456')
    expect((parsed.generalCommonInfo?.kpi as { finalParticipants?: number } | undefined)?.finalParticipants).toBe(
      510
    )
    expect(wageAmountsFromRows(parsed.generalCommonInfo?.wageGradeRows as Array<{ pricing?: string }>)).toEqual([
      123, 456, 789,
    ])
    const sessions = parsed.generalCommonInfo?.curriculumSessions as
      | Array<{ title?: string; description?: string }>
      | undefined
    expect(sessions?.[0]).toMatchObject({ title: '수정 단원', description: '수정 본문' })
    expect(hasOwn(parsed.generalCommonInfo, 'participantRecruitmentInfo')).toBe(false)
  })
})
