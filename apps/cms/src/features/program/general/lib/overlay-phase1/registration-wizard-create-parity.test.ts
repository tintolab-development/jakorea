/** @vitest-environment node */
import { describe, expect, it } from 'vitest'
import { applyGeneralRegistrationOverlayToProgram } from '@/features/program/general/lib/registration-overlay-to-program'
import { mapGeneralProgramToCreateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { serializeGeneralProgramServiceDetailJson } from '@/features/program/general/lib/general-program-service-detail-json'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { OVERLAY_PHASE0_KNOWN_DIFFS } from '@/features/program/general/lib/overlay-phase0/overlay-phase0-known-diff'
import { overlayKvToIndependentCommonInfoInput } from './overlay-kv-to-common-info-form-values'
import { buildIndependentCommonInfo } from './build-independent-common-info'
import { uiValuesToCommonInfoFormValues } from './registration-wizard-ui-to-common-info'
import { projectWizardUiValuesToOverlayForTest } from './registration-wizard-required-fields'
import { createRegistrationCreateSessionAuthoring } from './registration-wizard-structure'
import {
  buildGeneralProgramCreateFromWizardRhf,
  buildIndependentRegistrationCreateBaseline,
  editorExtrasFromWizardUi,
} from './build-registration-create-from-rhf'
import {
  createDefaultRegistrationWizardUiValues,
  type RegistrationWizardUiValues,
} from './registration-wizard-ui-values'
import { GENERAL_RHF_GATE_BLOCKERS } from './general-rhf-migration-gate'

type Audience = 'organization' | 'individual'
type Structure = 'curriculum' | 'schedule'
type Round = 'single' | 'multi'

type JsonDiff = {
  path: string
  legacy: unknown
  rhf: unknown
}

function diffJson(legacy: unknown, rhf: unknown, path = '$'): JsonDiff[] {
  if (Object.is(legacy, rhf)) return []
  const bothObjects =
    legacy != null &&
    rhf != null &&
    typeof legacy === 'object' &&
    typeof rhf === 'object' &&
    !Array.isArray(legacy) &&
    !Array.isArray(rhf)
  if (bothObjects) {
    const keys = new Set([
      ...Object.keys(legacy as Record<string, unknown>),
      ...Object.keys(rhf as Record<string, unknown>),
    ])
    return [...keys].flatMap(key =>
      diffJson(
        (legacy as Record<string, unknown>)[key],
        (rhf as Record<string, unknown>)[key],
        `${path}.${key}`
      )
    )
  }
  if (Array.isArray(legacy) && Array.isArray(rhf)) {
    const length = Math.max(legacy.length, rhf.length)
    return Array.from({ length }, (_, index) =>
      diffJson(legacy[index], rhf[index], `${path}[${index}]`)
    ).flat()
  }
  return [{ path, legacy, rhf }]
}

const VOLATILE_PATH = /(createdAt|updatedAt|id|rounds\[|startDate|endDate|applicationStartDate|applicationEndDate)/

function classifyKnownDiff(id: string): 'common-info-rhf' | 'recruit-application-followup' | 'unapproved-existing' {
  if (id === 'empty-public-title-apply-fallback') return 'common-info-rhf'
  if (
    id === 'recruit-detailinfo-reseed-gap' ||
    id === 'individual-schedule-writes-institution-prefix' ||
    id === 'recruit-save-locks-announcement-title' ||
    id === 'catalog-peek-not-getrecord' ||
    id === 'application-overlay-not-in-program-create'
  ) {
    return 'recruit-application-followup'
  }
  return 'unapproved-existing'
}

function filledCase(args: {
  programType: Structure
  sessionRoundType: Round
  audience: Audience
}): RegistrationWizardUiValues {
  const organization = args.audience === 'organization'
  const values = createDefaultRegistrationWizardUiValues({
    programType: args.programType,
    sessionRoundType: args.sessionRoundType,
    curriculumChartSessionCount: args.sessionRoundType === 'single' ? 2 : 1,
    curriculumSessionCount: args.sessionRoundType === 'multi' ? 2 : 1,
    scheduleCurriculumDetailCount: 2,
    scheduleCurriculumGroupCount: 1,
    participant: {
      individual: !organization,
      organization,
      teacherInstructor: false,
      volunteer: false,
    },
  })
  return {
    ...values,
    programTitleKo: `신규 ${args.programType} ${args.sessionRoundType} ${args.audience}`,
    programTitleEn: 'New Program',
    publicProgramTitle: '공고용 신규',
    detailedProgramId: args.programType === 'schedule' ? '' : '163006',
    detailedProgramName: args.programType === 'schedule' ? '해당없음' : '세부',
    businessField: 'career_employment',
    educationCourse: 'elementary',
    ipOwned: 'yes',
    courseDeliveredBy: 'ja',
    operationRangeSeal: { start: '2026-06-01', end: '2026-08-31' },
    sponsorId: '163001',
    sponsorIds: ['163001', '163002'],
    managerContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
    managerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
    kpiParticipantCount: 10,
    kpiInstructor: 0,
    kpiVolunteer: 0,
    wageGrade1Fee: 180000,
    wageGrade2Fee: 100000,
    wageGrade3Fee: 80000,
    paymentItemValues: ['traffic'],
    paymentItemLabels: '교통비',
    ipsType: { category: 'prepare', detail: 'none' },
    scheduleLines: args.sessionRoundType === 'multi' ? ['2026-06-10 10:00', '2026-06-11 10:00'] : ['2026-06-10 10:00'],
    singleDateIso: '2026-06-10',
    curriculum: {
      ...values.curriculum,
      unitNameBySession: { 1: '단원1', 2: '단원2', 3: 'ghost' },
      unitContentBySession: { 1: '본문1', 2: '본문2', 3: 'ghost-body' },
      progressSessionByRound: { 1: '1', 2: '2' },
      roundContentByRound: { 1: '복수본문1', 2: '복수본문2' },
    },
    schedule: {
      ...values.schedule,
      eventNameByDetail: { 1: '행사1', 2: '행사2' },
      groupTimesByDetail: {
        1: [{ startTime: '09:00', endTime: '10:00' }],
        2: [{ startTime: '13:00', endTime: '14:00' }],
      },
    },
  }
}

const CASES: Array<{ programType: Structure; sessionRoundType: Round; audience: Audience }> = (
  ['curriculum', 'schedule'] as const
).flatMap(programType =>
  (['single', 'multi'] as const).flatMap(sessionRoundType =>
    (['organization', 'individual'] as const).map(audience => ({
      programType,
      sessionRoundType,
      audience,
    }))
  )
)

describe('Phase 3 CREATE payload Legacy Overlay vs RHF Independent', () => {
  it('known-diff change_required 가 없고 기존 id 분류는 유지한다', () => {
    const required = OVERLAY_PHASE0_KNOWN_DIFFS.filter(item => item.change === 'change_required')
    expect(required.map(item => item.id)).toEqual([])
    expect(GENERAL_RHF_GATE_BLOCKERS).toEqual([])
    expect(classifyKnownDiff('empty-public-title-apply-fallback')).toBe('common-info-rhf')
    expect(classifyKnownDiff('recruit-detailinfo-reseed-gap')).toBe('recruit-application-followup')
    expect(classifyKnownDiff('individual-schedule-writes-institution-prefix')).toBe(
      'recruit-application-followup'
    )
    expect(classifyKnownDiff('serialize-rebuilds-overlay-from-nested')).toBe('unapproved-existing')
  })

  for (const testCase of CASES) {
    const label = `${testCase.programType}/${testCase.sessionRoundType}/${testCase.audience}`

    it(`${label}: adapter Independent draft가 overlay kv와 RHF UI에서 같다`, () => {
      const ui = filledCase(testCase)
      const overlay = {
        ...projectWizardUiValuesToOverlayForTest(ui),
        'application.thirdParty.recipient': 'must-not-copy',
        recruit: { blobUrl: 'blob:http://local/preview' },
      }
      const extras = editorExtrasFromWizardUi(ui)
      const baseline = buildIndependentRegistrationCreateBaseline({
        id: `parity-${label}`,
        uiValues: ui,
        editorExtras: extras,
      })
      const sessionAuthoring = createRegistrationCreateSessionAuthoring(extras.programType)
      const fromUi = buildIndependentCommonInfo({
        formValues: uiValuesToCommonInfoFormValues(ui),
        editorExtras: extras,
        baseline,
        mode: 'create',
        sessionAuthoring,
      })
      const adapted = overlayKvToIndependentCommonInfoInput(overlay)
      const fromOverlay = buildIndependentCommonInfo({
        formValues: adapted.formValues,
        editorExtras: extras,
        baseline,
        mode: 'create',
        sessionAuthoring,
      })
      expect(fromUi.programDraft.mainTitle).toBe(fromOverlay.programDraft.mainTitle)
      expect(fromUi.programDraft.generalCommonInfo?.curriculumSessions).toEqual(
        fromOverlay.programDraft.generalCommonInfo?.curriculumSessions
      )
      expect(fromUi.programDraft.generalCommonInfo?.scheduleDetails).toEqual(
        fromOverlay.programDraft.generalCommonInfo?.scheduleDetails
      )
      expect(fromUi.programDraft.generalCommonInfo?.educationScheduleLines).toEqual(
        fromOverlay.programDraft.generalCommonInfo?.educationScheduleLines
      )
      expect(fromUi.programDraft.generalCommonInfo?.kpi).toEqual(
        fromOverlay.programDraft.generalCommonInfo?.kpi
      )
    })

    it(`${label}: product CREATE 핵심 필드·application 분리·media blob 제외`, () => {
      const ui = filledCase(testCase)
      const overlay = {
        ...projectWizardUiValuesToOverlayForTest(ui),
        'application.thirdParty.recipient': 'must-not-copy',
        'recruit.detailInfo.keyVisualImage': 'blob:http://local/preview',
      }
      const extras = editorExtrasFromWizardUi(ui)
      const baseline = buildIndependentRegistrationCreateBaseline({
        id: `legacy-${label}`,
        uiValues: ui,
        editorExtras: extras,
      })
      const legacyProgram = {
        ...applyGeneralRegistrationOverlayToProgram(baseline, overlay, extras),
        generalProgramEducationStructure: extras.programType,
        generalProgramSessionRound: extras.sessionRoundType,
      }
      const rhf = buildGeneralProgramCreateFromWizardRhf({
        id: `rhf-${label}`,
        uiValues: ui,
        overlay,
      })
      const legacyRequest = mapGeneralProgramToCreateRequest(legacyProgram)
      const rhfRequest = rhf.createRequest
      const fetchKeys = JSON.stringify({ legacyRequest, rhfRequest })
      expect(fetchKeys.includes('application.thirdParty')).toBe(false)
      expect(JSON.stringify(rhf.persistOverlay).includes('application.thirdParty')).toBe(false)
      expect(JSON.stringify(rhfRequest).includes('blob:')).toBe(false)
      expect(rhfRequest.formBindings).toBeUndefined()
      expect(legacyRequest.formBindings).toBeUndefined()
      expect(rhfRequest.autoApplyDefaultFormBindings).toBe(true)
      expect(rhfRequest.mainTitle).toBe(ui.programTitleKo)
      expect(legacyRequest.mainTitle).toBe(ui.programTitleKo)
      expect(rhfRequest.sponsorId).toBe('163001')
      expect(rhf.program.generalCommonInfo?.sponsorManagementIds).toEqual(['163001', '163002'])
      expect(rhfRequest.programType).toBe(
        testCase.audience === 'organization' ? 'GENERAL_ORGANIZATION' : 'GENERAL_INDIVIDUAL'
      )

      if (testCase.programType === 'curriculum') {
        expect(rhf.program.generalCommonInfo?.scheduleDetails ?? []).toEqual([])
        const titles = (rhf.program.generalCommonInfo?.curriculumSessions ?? []).map(row => row.title)
        expect(titles).not.toContain('ghost')
        expect(titles.length).toBeGreaterThan(0)
      } else {
        expect(rhf.program.generalCommonInfo?.curriculumSessions ?? []).toEqual([])
        const names = (rhf.program.generalCommonInfo?.scheduleDetails ?? []).map(row => row.name)
        expect(names).toEqual(expect.arrayContaining(['행사1', '행사2']))
      }

      const nestedDiffs = diffJson(
        {
          curriculumSessions: legacyProgram.generalCommonInfo?.curriculumSessions,
          scheduleDetails: legacyProgram.generalCommonInfo?.scheduleDetails,
          educationScheduleLines: legacyProgram.generalCommonInfo?.educationScheduleLines,
          kpi: legacyProgram.generalCommonInfo?.kpi,
        },
        {
          curriculumSessions: rhf.program.generalCommonInfo?.curriculumSessions,
          scheduleDetails: rhf.program.generalCommonInfo?.scheduleDetails,
          educationScheduleLines: rhf.program.generalCommonInfo?.educationScheduleLines,
          kpi: rhf.program.generalCommonInfo?.kpi,
        }
      ).filter(item => !VOLATILE_PATH.test(item.path))

      const unexplained = nestedDiffs.filter(item => {
        if (item.path.includes('sessionNo')) return false
        if (item.path.includes('sessionLabel')) return false
        // Legacy apply는 overlay map 길이로 ghost 3회차를 남긴다. RHF extras count가 이긴다.
        if (
          item.path === '$.curriculumSessions[2]' &&
          item.rhf === undefined &&
          (item.legacy as { title?: string } | undefined)?.title === 'ghost'
        ) {
          return false
        }
        return true
      })
      expect(unexplained, JSON.stringify(unexplained, null, 2)).toEqual([])
      if (testCase.programType === 'curriculum') {
        expect(
          nestedDiffs.some(
            item =>
              item.path === '$.curriculumSessions[2]' &&
              (item.legacy as { title?: string } | undefined)?.title === 'ghost'
          )
        ).toBe(true)
      }

      const legacyJson = serializeGeneralProgramServiceDetailJson(legacyProgram)
      const rhfJson = serializeGeneralProgramServiceDetailJson(rhf.program)
      expect(typeof rhfJson === 'string' || rhfJson != null).toBe(true)
      expect(JSON.stringify(rhfJson).includes('blob:http://local/preview')).toBe(false)
      void legacyJson
    })
  }
})
