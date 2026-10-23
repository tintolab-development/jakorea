/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { useRegistrationWizardLeaveGuard } from '@/features/program/shared/lib/registration-wizard-leave-guard'
import {
  beginRegistrationWizardRhfOverlayProjection,
  endRegistrationWizardRhfOverlayProjection,
  getProgramRegistrationOverlayRecord,
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlayStoreForTests,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'
import {
  peekGeneralRegistrationWizardRhf,
  registerGeneralRegistrationWizardRhf,
} from './registration-wizard-rhf-api'
import { GeneralRegistrationWizardFormProvider } from '@/features/program/general/ui/registration/registration-wizard-form-provider'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'
import {
  applyCurriculumCountTrim,
  applyEducationStructureReset,
  applyScheduleDetailCountTrim,
} from './registration-wizard-structure'
import {
  hydrateRegistrationWizardUiValues,
  parseRegistrationWizardRhfSettings,
} from './registration-wizard-legacy-hydrate'
import { REGISTRATION_WIZARD_RHF_SETTINGS_KEY } from './registration-wizard-ui-values'
import {
  listIncompleteRegistrationWizardRequiredFields,
  projectWizardUiValuesToOverlayForTest,
} from './registration-wizard-required-fields'
import {
  buildGeneralProgramCreateFromWizardRhf,
  editorExtrasFromWizardUi,
} from './build-registration-create-from-rhf'
import type { GeneralProgramRegistrationRequiredFieldContext } from '@/features/program/general/lib/registration-required-fields'
import { readFileSync } from 'node:fs'
import path from 'node:path'

function OverlayTitleProbe() {
  const [value, setValue] = useProgramRegistrationOverlayKv(K.programTitleKo, '')
  return (
    <div>
      <span data-testid="title">{value}</span>
      <button type="button" onClick={() => setValue('RHF-우선')}>
        set
      </button>
    </div>
  )
}

const orgCtx: GeneralProgramRegistrationRequiredFieldContext = {
  participant: {
    individual: false,
    organization: true,
    teacherInstructor: false,
    volunteer: false,
  },
  programType: 'curriculum',
  sessionRoundType: 'single',
  educationFormScheduleDetail: 'common',
  participationScheduleDetail: 'common',
  ipsScheduleDetail: 'common',
  curriculumSessionCount: 1,
  curriculumChartSessionCount: 2,
  scheduleCurriculumDetailCount: 1,
  scheduleCurriculumGroupCount: 1,
  scheduleCurriculumPreEducation: false,
  educationScheduleMode: 'date',
  sponsorId: '163001',
  sponsorContactId: SPONSOR_CONTACT_UNSELECTED_VALUE,
  programTitleKo: '신규',
}

describe('Phase 2 RHF 정본 시나리오', () => {
  afterEach(() => {
    cleanup()
    registerGeneralRegistrationWizardRhf(null)
    resetProgramRegistrationOverlayStoreForTests()
  })

  it('RHF 입력 후 overlay store만 바꿔도 읽기·CREATE는 RHF가 이긴다', async () => {
    render(
      <GeneralRegistrationWizardFormProvider>
        <OverlayTitleProbe />
      </GeneralRegistrationWizardFormProvider>
    )
    await waitFor(() => {
      expect(peekGeneralRegistrationWizardRhf()).not.toBeNull()
    })
    fireEvent.click(document.querySelector('button') as HTMLButtonElement)
    await waitFor(() => {
      expect(peekGeneralRegistrationWizardRhf()?.getValues().programTitleKo).toBe('RHF-우선')
    })

    beginRegistrationWizardRhfOverlayProjection()
    try {
      replaceProgramRegistrationOverlay({ [K.programTitleKo]: 'overlay-stale' })
    } finally {
      endRegistrationWizardRhfOverlayProjection()
    }
    expect(getProgramRegistrationOverlayRecord()[K.programTitleKo]).toBe('overlay-stale')
    expect(peekGeneralRegistrationWizardRhf()?.getValues().programTitleKo).toBe('RHF-우선')

    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'ssot-1',
      uiValues: {
        ...peekGeneralRegistrationWizardRhf()!.getValues(),
        extras: {
          ...createDefaultRegistrationWizardUiValues().extras,
          participant: orgCtx.participant,
        },
      },
      overlay: getProgramRegistrationOverlayRecord(),
    })
    expect(created.program.mainTitle).toBe('RHF-우선')
  })

  it('커리큘럼↔일정 전환은 비활성 nested를 비우고 숨은 값은 검증/CREATE를 오염시키지 않는다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      programType: 'curriculum',
      curriculumChartSessionCount: 2,
      participant: orgCtx.participant,
    })
    values.curriculum.unitNameBySession = { 1: '단원1', 2: '단원2' }
    values.schedule.eventNameByDetail = { 1: '숨은일정' }
    const toSchedule = applyEducationStructureReset(values, 'schedule')
    expect(toSchedule.curriculum.unitNameBySession).toEqual({})
    expect(toSchedule.schedule.eventNameByDetail).toEqual({ 1: '숨은일정' })
    const scheduleKeys = listIncompleteRegistrationWizardRequiredFields(toSchedule, {
      ...orgCtx,
      programType: 'schedule',
    })
    expect(scheduleKeys.some(key => key.startsWith('curriculum.'))).toBe(false)

    toSchedule.schedule.eventNameByDetail = { 1: '행사1' }
    toSchedule.extras.scheduleCurriculumDetailCount = 1
    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'ssot-switch',
      uiValues: toSchedule,
    })
    expect(created.program.generalCommonInfo?.curriculumSessions ?? []).toEqual([])
    expect(
      (created.program.generalCommonInfo?.scheduleDetails ?? []).some(row => row.name === '단원1')
    ).toBe(false)
  })

  it('회차 4→2 축소와 2→0 삭제는 extras count를 따른다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      curriculumChartSessionCount: 4,
      participant: orgCtx.participant,
    })
    values.curriculum.unitNameBySession = { 1: '1', 2: '2', 3: '3', 4: '4' }
    const trimmed = applyCurriculumCountTrim(values, 2, 'chart')
    const created2 = buildGeneralProgramCreateFromWizardRhf({
      id: 'ssot-trim',
      uiValues: trimmed,
    })
    expect((created2.program.generalCommonInfo?.curriculumSessions ?? []).map(row => row.title)).toEqual([
      '1',
      '2',
    ])
    const deleted = applyCurriculumCountTrim(trimmed, 0, 'chart')
    const created0 = buildGeneralProgramCreateFromWizardRhf({
      id: 'ssot-zero',
      uiValues: deleted,
    })
    expect(created0.program.generalCommonInfo?.curriculumSessions ?? []).toEqual([])
  })

  it('일정 세부 축소와 사전교육 토글은 보이는 행만 CREATE에 넣는다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      programType: 'schedule',
      scheduleCurriculumDetailCount: 2,
      scheduleCurriculumPreEducation: false,
      participant: orgCtx.participant,
    })
    values.schedule.eventNameByDetail = { 1: 'A', 2: 'B' }
    const trimmed = applyScheduleDetailCountTrim(values, 1)
    trimmed.extras.scheduleCurriculumPreEducation = true
    trimmed.schedule.preEducationName = '사전 교육'
    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'ssot-pre',
      uiValues: trimmed,
    })
    const names = (created.program.generalCommonInfo?.scheduleDetails ?? []).map(row => row.name)
    expect(names).toContain('A')
    expect(names).not.toContain('B')
    expect(names.some(name => name.includes('사전'))).toBe(true)
  })

  it('후원사 다중 선택과 담당자 sentinel, 지급항목이 CREATE에 유지된다', () => {
    const values = createDefaultRegistrationWizardUiValues({
      participant: orgCtx.participant,
    })
    values.programTitleKo = '후원사'
    values.sponsorIds = ['163001', '163002']
    values.sponsorId = '163001'
    values.managerContactId = SPONSOR_CONTACT_UNSELECTED_VALUE
    values.managerContactIds = [SPONSOR_CONTACT_UNSELECTED_VALUE]
    values.paymentItemValues = ['traffic', 'meal']
    values.wageGrade1Fee = 180000
    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'ssot-sponsor',
      uiValues: values,
    })
    expect(created.program.sponsorId).toBe('163001')
    expect(created.program.generalCommonInfo?.sponsorManagementIds).toEqual(['163001', '163002'])
    expect(created.createRequest.sponsorId).toBe('163001')
    expect(created.program.generalCommonInfo?.paymentItems ?? created.createRequest).toBeTruthy()
    expect(created.persistOverlay[K.paymentItemValues]).toEqual(['traffic', 'meal'])
    expect(created.persistOverlay[K.managerContactId]).toBe(SPONSOR_CONTACT_UNSELECTED_VALUE)
  })

  it('settingsJson RHF draft가 overlay보다 우선 복원되고 markBaseline 후 dirty가 꺼진다', async () => {
    const restored = hydrateRegistrationWizardUiValues({
      overlay: { [K.programTitleKo]: 'overlay-draft' },
      settingsJson: {
        [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: {
          programTitleKo: 'rhf-draft',
          extras: { programType: 'curriculum' },
        },
      },
    })
    expect(restored.programTitleKo).toBe('rhf-draft')
    expect(parseRegistrationWizardRhfSettings({ foo: 1 })).toBeNull()

    render(
      <GeneralRegistrationWizardFormProvider>
        <OverlayTitleProbe />
      </GeneralRegistrationWizardFormProvider>
    )
    await waitFor(() => expect(peekGeneralRegistrationWizardRhf()).not.toBeNull())
    fireEvent.click(document.querySelector('button') as HTMLButtonElement)
    await waitFor(() => expect(peekGeneralRegistrationWizardRhf()?.isDirty()).toBe(true))
    peekGeneralRegistrationWizardRhf()?.markBaseline()
    await waitFor(() => expect(peekGeneralRegistrationWizardRhf()?.isDirty()).toBe(false))
  })

  it('leave guard는 RHF isDirtyOverride를 overlay version보다 우선한다', () => {
    const onLeave = () => undefined
    const dirtyRef = { current: false }
    const { result } = renderHook(() =>
      useRegistrationWizardLeaveGuard({
        open: true,
        onLeave,
        getOverlayVersion: () => 1,
        isDirtyOverride: () => dirtyRef.current,
      })
    )
    act(() => {
      result.current.requestLeave()
    })
    expect(result.current.leaveConfirmOpen).toBe(false)
    dirtyRef.current = true
    act(() => {
      result.current.requestLeave()
    })
    expect(result.current.leaveConfirmOpen).toBe(true)
    act(() => {
      result.current.markLeaveBaseline()
      result.current.cancelLeave()
    })
  })

  it('공유 overlay kv와 FormProvider는 일반 위저드에만 연결된다', () => {
    const modal = readFileSync(
      path.join(__dirname, '../../ui/registration/registration-fullpage-modal.tsx'),
      'utf8'
    )
    expect(modal).toContain("variant === 'general'")
    expect(modal).toContain('GeneralRegistrationWizardFormProvider')
    const overlaySync = readFileSync(
      path.join(
        __dirname,
        '../../../../template/ui/form-set/registration-form/general/program-registration-overlay-sync.ts'
      ),
      'utf8'
    )
    expect(overlaySync).toContain('peekGeneralRegistrationWizardRhf')
    expect(overlaySync).toContain('projectingFromWizardRhf')
  })

  it('overlay 투영 키는 제품 CREATE 경로의 비교용이며 extras는 overlay에 없다', () => {
    const values = createDefaultRegistrationWizardUiValues({ programType: 'schedule' })
    const overlay = projectWizardUiValuesToOverlayForTest(values)
    expect(overlay[K.programTitleKo]).toBe('')
    expect(Object.keys(overlay).some(key => key.includes('extras'))).toBe(false)
    expect(editorExtrasFromWizardUi(values).programType).toBe('schedule')
  })
})
