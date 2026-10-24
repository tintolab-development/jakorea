/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'
import type { ProgramUpdateRequest } from '@/shared/api/generated/logs/schemas/programUpdateRequest'
import type { Program } from '@/types/domain'
import {
  mapCompanySchoolDetailToProgram,
  mapCompanySchoolToCreateRequest,
  mapCompanySchoolToUpdateRequest,
} from '@/features/program/1c-1s/api/adapters'
import { parseCompanySchoolServiceDetailJson } from '@/features/program/1c-1s/api/service-detail-json'
import {
  replaceProgramRegistrationOverlayPrefix,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  detailEditValuesToProgramPatch,
  narrowProgramDetailPatchForCommonInfoSave,
  programToDetailEditValues,
} from '@/features/program/shared/model/program-detail-edit-schema'
import { buildCompanySchoolProgramFromRhf } from './build-registration-create-from-canonical'
import { companySchoolCompatibilityOverlayFromDetailEditValues } from './detail-form-compatibility-overlay'
import {
  applyLiveEconomyAnnouncementToProgram,
  ECONOMY_PUBLIC_PROGRAM_TITLE_KEY,
  mergeCompanySchoolDetailSaveOverlay,
  readEconomyRegistrationOverlayForSave,
  resolveCompanySchoolDetailSaveAnnouncementTitle,
  seedEconomyRegistrationOverlayFromProgram,
  writeEconomyRegistrationOverlayFromProgramDraft,
} from './registration-overlay-sync'
import {
  emptyCompanySchoolApplicationFormState,
  serializeCompanySchoolApplicationForFormVersion,
} from './registration-rhf-application'
import { emptyCompanySchoolRecruitFormState } from './registration-rhf-recruitment'
import {
  createDefaultCompanySchoolRegistrationRhfValues,
  type CompanySchoolRegistrationRhfValues,
} from './registration-rhf-values'

const PAYMENT_IDS = ['p-166201', 'p-166204'] as const
const INSTRUCTOR_NOTES_KEY = 'application.instructor.notes'
const INSTRUCTOR_RECRUIT_KEY = 'recruitment.instructor.notes'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function filledRecruit() {
  return {
    ...emptyCompanySchoolRecruitFormState(),
    programRange: { start: '2026-04-01', end: '2026-12-31' },
    recruitRange: { start: '2026-03-01', end: '2026-03-31' },
    finalAnnounce: '2026-04-02',
    finalAnnounceMethod: '홈페이지',
    maxAssignableInstructors: 5,
    maxClassCount: 20,
    targetLevels: ['ELEMENTARY'],
    inquiryContact: '담당RHF',
    inquiryTel: '02-0000-0000',
    inquiryEmail: 'cs@example.com',
    announcementPublished: 'published',
    notes: 'RHF 비고',
    detailInfo: {
      programDescription: '<p>소개</p>',
      recruitmentGuide: '<p>안내</p>',
      applicationMethod: '<p>방법</p>',
      learningSupportContent: '<p>지원</p>',
      additionalContentHtml: '<p>RHF 상세</p>',
      thumbFileObjectId: 77,
      attachmentFileObjectIds: [11, 22],
      thumbFileName: 'thumb.png',
      thumbContentUrl: 'https://cdn.example/thumb.png',
      attachmentFileNames: ['a.pdf', 'b.pdf'],
    },
  }
}

function filledApplication() {
  return {
    ...emptyCompanySchoolApplicationFormState(),
    basicInfo: {
      ...emptyCompanySchoolApplicationFormState().basicInfo,
      applicationGrade: '초등 5',
      classCount: '3',
      totalStudents: '90',
      teacherTel: '02-111-2222',
    },
  }
}

function fixtureARhf(): CompanySchoolRegistrationRhfValues {
  return {
    ...createDefaultCompanySchoolRegistrationRhfValues(),
    repKo: 'P4 신규 1사1교',
    repEn: 'P4 Company School',
    publicProgramTitle: 'P4 공고명',
    detailedProgramId: '163006',
    detailedProgramName: 'P4 세부',
    operationRange: { start: '2026-01-10', end: '2026-11-30' },
    sponsorId: 'sponsor-p4',
    managerContactIds: ['contact-p4'],
    educationCourse: 'ja',
    participantCount: 20,
    instructor: 0,
    dispatchedSchool: 3,
    dispatchedClass: null,
    grade1Fee: 100000,
    grade1DistanceFee: 0,
    grade2Fee: 120000,
    grade2DistanceFee: 130000,
    grade3Fee: 140000,
    grade3DistanceFee: 150000,
    paymentItemValues: [...PAYMENT_IDS],
    generalSurveyMenuKeys: [],
    curriculumSessions: [
      { sessionLabel: '1차시', title: 'P4 1차시', description: 'P4 내용1' },
      { sessionLabel: '2차시', title: 'P4 2차시', description: 'P4 내용2' },
    ],
    educationScheduleRange: { start: '2026-04-01', end: '2026-04-30' },
    recruitment: filledRecruit(),
    application: filledApplication(),
  }
}

function overlayOf(program: Pick<Program, 'registrationOverlay'> | null | undefined) {
  return program?.registrationOverlay ?? {}
}

function expectPaymentAndWageCompat(overlay: Record<string, unknown>) {
  expect(overlay['economyRegistration.wageInfo.paymentItemValues']).toEqual([...PAYMENT_IDS])
  expect(overlay['economyRegistration.wageInfo.grade1Fee']).toBe(100000)
  expect(overlay['economyRegistration.wageInfo.grade1DistanceFee']).toBe(0)
  expect(overlay['economyRegistration.wageInfo.grade2Fee']).toBe(120000)
  expect(overlay['economyRegistration.wageInfo.grade2DistanceFee']).toBe(130000)
  expect(overlay['economyRegistration.wageInfo.grade3Fee']).toBe(140000)
  expect(overlay['economyRegistration.wageInfo.grade3DistanceFee']).toBe(150000)
}

function expectNoApplicationEconomy(overlay: Record<string, unknown>) {
  expect(Object.keys(overlay).some(key => key.startsWith('application.economy.'))).toBe(false)
}

function createRequestToGetDto(
  id: string,
  request: Record<string, unknown>
): ProgramResponse {
  return {
    id,
    programType: 'COMPANY_SCHOOL',
    title: request.title,
    mainTitle: request.mainTitle,
    titleEn: request.titleEn,
    sponsorId: request.sponsorId,
    startDate: request.startDate,
    endDate: request.endDate,
    businessStartDate: request.businessStartDate ?? request.startDate,
    businessEndDate: request.businessEndDate ?? request.endDate,
    detailedProgramId: request.detailedProgramId,
    businessArea: request.businessArea,
    ipOwned: request.ipOwned,
    courseDeliveredBy: request.courseDeliveredBy,
    partnerInvolvement: request.partnerInvolvement,
    educationProcess: request.educationProcess,
    ips: request.ips,
    instructors: request.instructors,
    generalVolunteers: request.generalVolunteers,
    rounds: request.rounds,
    serviceDetailJson: request.serviceDetailJson,
    recruitments: request.recruitments,
  } as ProgramResponse
}

/**
 * 가짜 PATCH 서버.
 * - 컬럼은 요청에 실린 키만 교체한다.
 * - serviceDetailJson 이 오면 envelope/program 키는 생략=유지, 중첩 generalCommonInfo는 키 단위 교체.
 * - registration.overlay 가 오면 객체 전체를 교체한다(부분 overlay를 deep merge 해서 감추지 않음).
 */
function applyUpdateReplaceSemantics(
  current: ProgramResponse,
  patch: ProgramUpdateRequest
): ProgramResponse {
  const next: ProgramResponse = { ...current }
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || key === 'serviceDetailJson') continue
    ;(next as Record<string, unknown>)[key] = value
  }
  if (patch.serviceDetailJson == null) return next
  const prev = coerceJson(current.serviceDetailJson)
  const incoming = coerceJson(patch.serviceDetailJson)
  const prevProgram = isRecord(prev.program) ? prev.program : {}
  const nextProgram = isRecord(incoming.program) ? incoming.program : {}
  const prevCommon = isRecord(prevProgram.generalCommonInfo) ? prevProgram.generalCommonInfo : {}
  const nextCommon = isRecord(nextProgram.generalCommonInfo) ? nextProgram.generalCommonInfo : undefined
  const registration = isRecord(incoming.registration)
    ? incoming.registration
    : prev.registration
  next.serviceDetailJson = JSON.stringify({
    schemaVersion: incoming.schemaVersion ?? prev.schemaVersion ?? 1,
    program: {
      ...prevProgram,
      ...nextProgram,
      ...(nextCommon
        ? { generalCommonInfo: { ...prevCommon, ...nextCommon } }
        : { generalCommonInfo: prevCommon }),
    },
    ...(isRecord(registration) ? { registration } : {}),
  })
  return next
}

function coerceJson(raw: unknown): Record<string, unknown> {
  if (isRecord(raw)) return raw
  if (typeof raw !== 'string' || !raw.trim()) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    return isRecord(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function getProgram(dto: ProgramResponse): Program {
  return mapCompanySchoolDetailToProgram(dto)
}

function simulateCommonInfoSave(
  loaded: Program,
  edit: Partial<ReturnType<typeof programToDetailEditValues>>,
  options?: { skipSeed?: boolean }
) {
  if (!options?.skipSeed) {
    seedEconomyRegistrationOverlayFromProgram(loaded)
  }
  const values = { ...programToDetailEditValues(loaded), ...edit }
  const liveOverlay = readEconomyRegistrationOverlayForSave()
  const liveAnnouncement = resolveCompanySchoolDetailSaveAnnouncementTitle({
    formAnnouncement: values.announcementTitle,
    overlayAnnouncement: liveOverlay[ECONOMY_PUBLIC_PROGRAM_TITLE_KEY],
    programAnnouncement: loaded.generalCommonInfo?.announcementTitle,
  })
  const valuesForPatch = { ...values, announcementTitle: liveAnnouncement }
  const patch = narrowProgramDetailPatchForCommonInfoSave(
    detailEditValuesToProgramPatch(valuesForPatch, loaded)
  )
  const formCompat = companySchoolCompatibilityOverlayFromDetailEditValues(valuesForPatch)
  const draft = applyLiveEconomyAnnouncementToProgram(
    {
      ...loaded,
      ...patch,
      generalCommonInfo: {
        ...loaded.generalCommonInfo,
        ...patch.generalCommonInfo,
        announcementTitle: liveAnnouncement ?? patch.generalCommonInfo?.announcementTitle,
      },
      registrationOverlay: {
        ...(loaded.registrationOverlay ?? {}),
        ...formCompat,
      },
    },
    { ...liveOverlay, ...formCompat },
    loaded.generalCommonInfo?.announcementTitle
  )
  writeEconomyRegistrationOverlayFromProgramDraft(draft)
  const registrationOverlay = mergeCompanySchoolDetailSaveOverlay(draft, {
    ...readEconomyRegistrationOverlayForSave(),
  })
  const request = mapCompanySchoolToUpdateRequest(
    { ...draft, registrationOverlay },
    {
      ...patch,
      generalCommonInfo: {
        ...patch.generalCommonInfo,
        announcementTitle: draft.generalCommonInfo?.announcementTitle,
      },
      registrationOverlay,
    }
  )
  return { values: valuesForPatch, patch, request, registrationOverlay }
}

function fixtureBLegacyProgram(): Program {
  return {
    id: 'company-school-local-p4-b',
    backendProgramType: 'COMPANY_SCHOOL',
    sponsorId: 'sponsor-legacy',
    title: '레거시 1사1교',
    mainTitle: '레거시 1사1교',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    startDate: '2026-04-01',
    endDate: '2026-10-31',
    status: 'pending',
    rounds: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    generalCommonInfo: {
      announcementTitle: '레거시 공고',
      paymentItems: '교통비(일사일교), 숙박비(일사일교)',
      wageGradeRows: [
        { grade: '1급 강사비', pricing: '1시간 당 | 기본 : 100,000원 | 장거리 : 0원' },
        { grade: '2급 강사비', pricing: '1시간 당 | 기본 : 120,000원 | 장거리 : 130,000원' },
        { grade: '3급 강사비', pricing: '1시간 당 | 기본 : 140,000원 | 장거리 : 150,000원' },
      ],
      kpi: {
        finalParticipants: 0,
        instructorCount: 0,
        volunteerCount: 0,
        finalSchools: 0,
        finalClasses: 0,
      },
    },
    registrationOverlay: {
      'economyRegistration.basicInfo.repKo': '레거시 1사1교',
      'economyRegistration.basicInfo.publicProgramTitle': '레거시 공고',
      'economyRegistration.wageInfo.paymentItemValues': [...PAYMENT_IDS],
      'economyRegistration.wageInfo.grade1Fee': 100000,
      'economyRegistration.wageInfo.grade1DistanceFee': 0,
      'economyRegistration.wageInfo.grade2Fee': 120000,
      'economyRegistration.wageInfo.grade2DistanceFee': 130000,
      'economyRegistration.wageInfo.grade3Fee': 140000,
      'economyRegistration.wageInfo.grade3DistanceFee': 150000,
      'economyRegistration.kpi.participantCount': 0,
      'economyRegistration.kpi.instructor': null,
      'economyRegistration.kpi.dispatchedSchool': 3,
      'economyRegistration.kpi.dispatchedClass': null,
      'recruit.maxClassCount': 20,
      'economyRecruit.detailInfo.thumbFileObjectId': 77,
      'economyRecruit.detailInfo.attachmentFileObjectIds': [11, 22],
      [INSTRUCTOR_NOTES_KEY]: '강사 신청 leftover',
      [INSTRUCTOR_RECRUIT_KEY]: '강사 모집 leftover',
    },
  } as Program
}

describe('1사1교 상세 GET→수정→PATCH→재GET 호환 왕복', () => {
  afterEach(() => {
    resetProgramRegistrationOverlay()
  })

  it('A CREATE 출처: 공통·강사비 ID/숫자·KPI·모집 leftover가 GET에서 유지되고 신청은 혼입되지 않는다', () => {
    const created = buildCompanySchoolProgramFromRhf({
      id: 'company-school-local-p4-a',
      values: fixtureARhf(),
    })
    created.registrationOverlay = {
      ...overlayOf(created),
      [INSTRUCTOR_NOTES_KEY]: '강사 신청 leftover',
      [INSTRUCTOR_RECRUIT_KEY]: '강사 모집 leftover',
    }
    expect(created.generalCommonInfo?.announcementTitle).toBe('P4 공고명')
    expect(created.generalCommonInfo?.kpi?.finalParticipants).toBe(20)
    expect(created.generalCommonInfo?.kpi?.instructorCount).toBe(0)
    expect(created.registrationOverlay?.['economyRegistration.kpi.dispatchedClass']).toBeNull()
    expectPaymentAndWageCompat(overlayOf(created))
    expectNoApplicationEconomy(overlayOf(created))
    const formVersion = serializeCompanySchoolApplicationForFormVersion(fixtureARhf().application)
    expect(formVersion['application.economy.basicInfo.applicationGrade']).toBe('초등 5')

    const createRequest = mapCompanySchoolToCreateRequest(created)
    const createOverlay = coerceJson(createRequest.serviceDetailJson).registration
    const persistedOverlay = isRecord(createOverlay) && isRecord(createOverlay.overlay)
      ? createOverlay.overlay
      : {}
    expectPaymentAndWageCompat(persistedOverlay)
    expect(persistedOverlay['economyRecruit.detailInfo.thumbFileObjectId']).toBe(77)
    expect(persistedOverlay['economyRecruit.detailInfo.attachmentFileObjectIds']).toEqual([11, 22])
    expect(persistedOverlay[INSTRUCTOR_NOTES_KEY]).toBe('강사 신청 leftover')
    expectNoApplicationEconomy(persistedOverlay)

    const stored = createRequestToGetDto('company-school-local-p4-a', createRequest as Record<string, unknown>)
    const loaded = getProgram(stored)
    expect(loaded.generalCommonInfo?.announcementTitle).toBe('P4 공고명')
    expect(loaded.generalSurveyMenuKeys).toEqual([])
    expect(overlayOf(loaded)['recruit.programRangeSeal']).toEqual({
      start: '2026-04-01',
      end: '2026-12-31',
    })
    expect(overlayOf(loaded)['recruit.recruitRangeSeal']).toEqual({
      start: '2026-03-01',
      end: '2026-03-31',
    })
    expect(overlayOf(loaded)['economyRegistration.basicInfo.operationRangeSeal']).not.toEqual(
      overlayOf(loaded)['recruit.recruitRangeSeal']
    )
    expect(overlayOf(loaded)['economyRegistration.basicInfo.operationRangeSeal']).not.toEqual(
      overlayOf(loaded)['recruit.programRangeSeal']
    )
    expectPaymentAndWageCompat(overlayOf(loaded))
    expect(overlayOf(loaded)['economyRegistration.kpi.dispatchedClass']).toBeNull()
    expect(overlayOf(loaded)['economyRecruit.detailInfo.thumbFileObjectId']).toBe(77)
    expectNoApplicationEconomy(overlayOf(loaded))

    seedEconomyRegistrationOverlayFromProgram(loaded)
    const seeded = readEconomyRegistrationOverlayForSave()
    expectPaymentAndWageCompat(seeded)
    expect(seeded['economyRegistration.kpi.dispatchedClass']).toBeNull()
    expect(seeded['economyRegistration.basicInfo.publicProgramTitle']).toBe('P4 공고명')

    const hydrated = programToDetailEditValues(loaded)
    expect(hydrated.wagePaymentItemIds).toEqual([...PAYMENT_IDS])
    expect(hydrated.kpiInstructorCount).toBe(0)
    expect(hydrated.kpiFinalClasses).toBeUndefined()
    expect(hydrated.surveySurvey).toBe(false)
    expect(hydrated.surveySatisfaction).toBe(false)
    expect(hydrated.surveyLectureEvaluation).toBe(false)
  })

  it('B Legacy GET-only: 지급항목 ID·강사비 0·KPI null이 표시되고 PATCH는 발생하지 않는다', () => {
    const stored = createRequestToGetDto('company-school-local-p4-b', {
      title: '레거시 1사1교',
      mainTitle: '레거시 1사1교',
      startDate: '2026-04-01',
      endDate: '2026-10-31',
      serviceDetailJson: JSON.stringify({
        schemaVersion: 1,
        program: fixtureBLegacyProgram(),
        registration: { overlay: overlayOf(fixtureBLegacyProgram()) },
      }),
    })
    const loaded = getProgram(stored)
    seedEconomyRegistrationOverlayFromProgram(loaded)
    const values = programToDetailEditValues(loaded)
    expect(values.wagePaymentItemIds).toEqual([...PAYMENT_IDS])
    expect(values.kpiInstructorCount).toBeUndefined()
    expect(values.kpiFinalClasses).toBeUndefined()
    expect(overlayOf(loaded)['economyRegistration.wageInfo.grade1DistanceFee']).toBe(0)
    expect(overlayOf(loaded)[INSTRUCTOR_NOTES_KEY]).toBe('강사 신청 leftover')
    expect(Object.prototype.hasOwnProperty.call(stored, 'patched')).toBe(false)
  })

  it('C Program canonical이 제목·기간에서 overlay leftover보다 이기고 지급항목 ID는 leftover가 이긴다', () => {
    const leftoverTitle = '구 제목'
    const leftoverPeriod = { start: '2020-01-01', end: '2020-01-31' }
    const created = buildCompanySchoolProgramFromRhf({
      id: 'company-school-local-p4-c',
      values: fixtureARhf(),
    })
    const colliding: Program = {
      ...created,
      title: '최신 제목',
      mainTitle: '최신 제목',
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-09-30T00:00:00.000Z',
      generalCommonInfo: {
        ...created.generalCommonInfo,
        announcementTitle: '최신 공고',
        detailedProgramName: '최신 세부',
        paymentItems: '교통비(일사일교), 숙박비(일사일교)',
      },
      registrationOverlay: {
        ...overlayOf(created),
        'economyRegistration.basicInfo.repKo': leftoverTitle,
        'economyRegistration.basicInfo.publicProgramTitle': '구 공고',
        'economyRegistration.basicInfo.operationRangeSeal': leftoverPeriod,
        'economyRegistration.wageInfo.paymentItemValues': [...PAYMENT_IDS],
      },
    }
    seedEconomyRegistrationOverlayFromProgram(colliding)
    const seeded = readEconomyRegistrationOverlayForSave()
    expect(seeded['economyRegistration.basicInfo.repKo']).toBe('최신 제목')
    expect(seeded['economyRegistration.basicInfo.publicProgramTitle']).toBe('최신 공고')
    expect(seeded['economyRegistration.wageInfo.paymentItemValues']).toEqual([...PAYMENT_IDS])
    expect(seeded['economyRegistration.basicInfo.operationRangeSeal']).not.toEqual(leftoverPeriod)

    const { request } = simulateCommonInfoSave(colliding, {})
    const persisted = coerceJson(request.serviceDetailJson)
    const overlay = isRecord(persisted.registration) && isRecord(persisted.registration.overlay)
      ? persisted.registration.overlay
      : {}
    expect(overlay['economyRegistration.basicInfo.publicProgramTitle']).toBe('최신 공고')
    expect(overlay['economyRegistration.wageInfo.paymentItemValues']).toEqual([...PAYMENT_IDS])
  })

  it('D 명시적 빈 값과 설문 []는 저장 후 기본값으로 복원되지 않는다', () => {
    const created = buildCompanySchoolProgramFromRhf({
      id: 'company-school-local-p4-d',
      values: fixtureARhf(),
    })
    const stored = createRequestToGetDto(
      'company-school-local-p4-d',
      mapCompanySchoolToCreateRequest(created) as Record<string, unknown>
    )
    const loaded = getProgram(stored)
    const { request } = simulateCommonInfoSave(loaded, {
      announcementTitle: '',
      sponsorId: '',
      sponsorManagementIds: [],
      sponsorManagerContactIds: [],
      surveySurvey: false,
      surveySatisfaction: false,
      surveyLectureEvaluation: false,
      wagePaymentItemIds: [],
      curriculumSession1Title: '',
      curriculumSession1Description: '',
    })
    const reloaded = getProgram(applyUpdateReplaceSemantics(stored, request))
    expect(reloaded.generalCommonInfo?.announcementTitle ?? '').toBe('')
    expect(reloaded.generalSurveyMenuKeys).toEqual([])
    expect(reloaded.generalCommonInfo?.curriculumSessions?.[0]?.title).toBe('')
    expect(overlayOf(reloaded)['economyRegistration.wageInfo.paymentItemValues']).toEqual([])
  })

  it('E 부분 PATCH: 공고명만 바꿔도 지급항목 ID·모집 미디어·강사 leftover가 유지된다', () => {
    const created = buildCompanySchoolProgramFromRhf({
      id: 'company-school-local-p4-e',
      values: fixtureARhf(),
    })
    created.registrationOverlay = {
      ...overlayOf(created),
      [INSTRUCTOR_NOTES_KEY]: '강사 신청 leftover',
      [INSTRUCTOR_RECRUIT_KEY]: '강사 모집 leftover',
    }
    const stored = createRequestToGetDto(
      'company-school-local-p4-e',
      mapCompanySchoolToCreateRequest(created) as Record<string, unknown>
    )
    const loaded = getProgram(stored)
    const { request, patch } = simulateCommonInfoSave(loaded, {
      announcementTitle: '공고명만 변경',
    })
    expect(patch.applicationStartDate).toBeUndefined()
    expect(patch.rounds).toBeUndefined()
    expect(patch.generalCommonInfo?.participantRecruitmentInfo).toBeUndefined()
    expect(request.applicationStartDate).toBeUndefined()
    expect(request.rounds).toBeUndefined()

    const reloaded = getProgram(applyUpdateReplaceSemantics(stored, request))
    expect(reloaded.generalCommonInfo?.announcementTitle).toBe('공고명만 변경')
    expectPaymentAndWageCompat(overlayOf(reloaded))
    expect(overlayOf(reloaded)['economyRecruit.detailInfo.thumbFileObjectId']).toBe(77)
    expect(overlayOf(reloaded)['economyRecruit.detailInfo.attachmentFileObjectIds']).toEqual([
      11, 22,
    ])
    expect(overlayOf(reloaded)[INSTRUCTOR_NOTES_KEY]).toBe('강사 신청 leftover')
    expect(overlayOf(reloaded)[INSTRUCTOR_RECRUIT_KEY]).toBe('강사 모집 leftover')
    expectNoApplicationEconomy(overlayOf(reloaded))
    expect(reloaded.generalCommonInfo?.kpi?.finalParticipants).toBe(20)
    expect(overlayOf(reloaded)['economyRegistration.kpi.dispatchedClass']).toBeNull()
  })

  it('상세 overlay 단락 공고명이 stale infoForm보다 PATCH overlay 정본이다', () => {
    const created = buildCompanySchoolProgramFromRhf({
      id: 'company-school-local-p5-r1-b04',
      values: fixtureARhf(),
    })
    const stored = createRequestToGetDto(
      'company-school-local-p5-r1-b04',
      mapCompanySchoolToCreateRequest(created) as Record<string, unknown>
    )
    const loaded = getProgram(stored)
    seedEconomyRegistrationOverlayFromProgram(loaded)
    const overlay = readEconomyRegistrationOverlayForSave()
    expect(overlay[ECONOMY_PUBLIC_PROGRAM_TITLE_KEY]).toBe(fixtureARhf().publicProgramTitle)
    replaceProgramRegistrationOverlayPrefix('economyRegistration.', {
      ...overlay,
      [ECONOMY_PUBLIC_PROGRAM_TITLE_KEY]: 'RHF-B-공고명-PATCH',
    })
    const { request } = simulateCommonInfoSave(loaded, {}, { skipSeed: true })
    const persisted = coerceJson(request.serviceDetailJson)
    const persistedOverlay =
      isRecord(persisted.registration) && isRecord(persisted.registration.overlay)
        ? persisted.registration.overlay
        : {}
    expect(persistedOverlay[ECONOMY_PUBLIC_PROGRAM_TITLE_KEY]).toBe('RHF-B-공고명-PATCH')
    expect(persistedOverlay['economyRegistration.wageInfo.paymentItemValues']).toEqual(
      overlay['economyRegistration.wageInfo.paymentItemValues']
    )
  })

  it('E KPI 한 항목만 수정해도 나머지 KPI·강사비 ID는 유지된다', () => {
    const created = buildCompanySchoolProgramFromRhf({
      id: 'company-school-local-p4-e-kpi',
      values: fixtureARhf(),
    })
    const stored = createRequestToGetDto(
      'company-school-local-p4-e-kpi',
      mapCompanySchoolToCreateRequest(created) as Record<string, unknown>
    )
    const loaded = getProgram(stored)
    const { request } = simulateCommonInfoSave(loaded, { kpiFinalParticipants: 80 })
    const reloaded = getProgram(applyUpdateReplaceSemantics(stored, request))
    expect(reloaded.generalCommonInfo?.kpi?.finalParticipants).toBe(80)
    expect(overlayOf(reloaded)['economyRegistration.kpi.participantCount']).toBe(80)
    expect(overlayOf(reloaded)['economyRegistration.kpi.instructor']).toBe(0)
    expect(overlayOf(reloaded)['economyRegistration.kpi.dispatchedClass']).toBeNull()
    expectPaymentAndWageCompat(overlayOf(reloaded))
  })

  it('E 모집 정보만 PATCH해도 공통 지급항목 ID와 신청 키는 그대로다', () => {
    const created = buildCompanySchoolProgramFromRhf({
      id: 'company-school-local-p4-e-recruit',
      values: fixtureARhf(),
    })
    created.registrationOverlay = {
      ...overlayOf(created),
      [INSTRUCTOR_NOTES_KEY]: '강사 신청 leftover',
    }
    const stored = createRequestToGetDto(
      'company-school-local-p4-e-recruit',
      mapCompanySchoolToCreateRequest(created) as Record<string, unknown>
    )
    const loaded = getProgram(stored)
    const recruitOverlay = {
      ...overlayOf(loaded),
      'recruit.maxClassCount': 99,
    }
    const request = mapCompanySchoolToUpdateRequest(loaded, {
      generalCommonInfo: {
        participantRecruitmentInfo: {
          ...loaded.generalCommonInfo?.participantRecruitmentInfo,
          maxClassCount: 99,
        },
      },
      registrationOverlay: recruitOverlay,
    })
    const parsed = coerceJson(request.serviceDetailJson)
    const programSlice = isRecord(parsed.program) ? parsed.program : {}
    const common = isRecord(programSlice.generalCommonInfo) ? programSlice.generalCommonInfo : {}
    expect(common.participantRecruitmentInfo).toBeTruthy()
    const overlay = isRecord(parsed.registration) && isRecord(parsed.registration.overlay)
      ? parsed.registration.overlay
      : {}
    expect(overlay['recruit.maxClassCount']).toBe(99)
    expectPaymentAndWageCompat(overlay)
    expect(overlay[INSTRUCTOR_NOTES_KEY]).toBe('강사 신청 leftover')
    expectNoApplicationEconomy(overlay)

    const reloaded = getProgram(applyUpdateReplaceSemantics(stored, request))
    expect(reloaded.generalCommonInfo?.participantRecruitmentInfo?.maxClassCount).toBe(99)
    expectPaymentAndWageCompat(overlayOf(reloaded))
    expect(parseCompanySchoolServiceDetailJson(request.serviceDetailJson).registrationOverlay?.[
      'economyRegistration.wageInfo.paymentItemValues'
    ]).toEqual([...PAYMENT_IDS])
  })
})
