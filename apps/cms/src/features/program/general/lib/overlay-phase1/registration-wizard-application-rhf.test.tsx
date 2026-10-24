/** @vitest-environment jsdom */
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
  peekGeneralApplicationOverlayRecord,
  replaceGeneralApplicationOverlayForScope,
  resetGeneralApplicationOverlayStoreForTests,
  setGeneralApplicationOverlayScope,
  useGeneralApplicationOverlayKv,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { GeneralRegistrationWizardFormProvider } from '@/features/program/general/ui/registration/registration-wizard-form-provider'
import {
  beginWizardApplicationRhfProjection,
  endWizardApplicationRhfProjection,
  canonicalizeWizardApplicationKv,
  selectApplicationKvForParticipant,
} from './registration-wizard-application-rhf'
import { peekGeneralRegistrationWizardRhf, registerGeneralRegistrationWizardRhf } from './registration-wizard-rhf-api'
import { createDefaultRegistrationWizardUiValues } from './registration-wizard-ui-values'
import { collectWizardApplicationOverlayForCatalog } from './registration-wizard-application-from-rhf'
import { stripApplicationKeysFromOverlay } from './registration-wizard-ui-to-common-info'
import { buildGeneralProgramCreateFromWizardRhf } from './build-registration-create-from-rhf'
import { listIncompleteApplicationFormThirdPartyRecipientKeys } from '@/features/template/model/application-form-third-party-recipient'
import { createProgramApplicationFormInstitutionDraft } from '@/features/template/model/program-application-form-institution-draft'
import { APPLICATION_FORM_THIRD_PARTY_RECIPIENT_PLACEHOLDER } from '@/features/template/model/application-form-third-party-recipient'

function Probe({ overlayKey, testId }: { overlayKey: string; testId: string }) {
  const [value, setValue] = useGeneralApplicationOverlayKv(overlayKey, '')
  return (
    <div>
      <span data-testid={testId}>{String(value)}</span>
      <button type="button" onClick={() => setValue('RHF-우선')} data-testid={`${testId}-set`}>
        set
      </button>
    </div>
  )
}

describe('일반 신규 등록 신청 RHF 정본', () => {
  afterEach(() => {
    cleanup()
    registerGeneralRegistrationWizardRhf(null)
    resetGeneralApplicationOverlayStoreForTests()
  })

  it('공유 단락 입력은 Overlay와 달라도 RHF를 표시한다', () => {
    render(
      <GeneralRegistrationWizardFormProvider>
        <Probe overlayKey="application.institution.teacherTel" testId="tel" />
      </GeneralRegistrationWizardFormProvider>
    )
    act(() => {
      peekGeneralRegistrationWizardRhf()?.reset(
        {
          ...peekGeneralRegistrationWizardRhf()!.getValues(),
          extras: {
            ...peekGeneralRegistrationWizardRhf()!.getValues().extras,
            participant: {
              ...peekGeneralRegistrationWizardRhf()!.getValues().extras.participant,
              organization: true,
            },
          },
        },
        { keepDirty: true }
      )
      peekGeneralRegistrationWizardRhf()?.setPath(
        'applicationKv',
        { 'application.institution.teacherTel': 'RHF-정본' },
        { shouldDirty: true }
      )
    })
    act(() => {
      beginWizardApplicationRhfProjection()
      try {
        patchGeneralApplicationOverlay({ 'application.institution.teacherTel': 'STALE' })
      } finally {
        endWizardApplicationRhfProjection()
      }
    })
    expect(document.querySelector('[data-testid="tel"]')?.textContent).toBe('RHF-정본')
  })

  it('RHF가 없으면 기존 Overlay store만 갱신한다', () => {
    setGeneralApplicationOverlayScope('application-instructor')
    patchGeneralApplicationOverlay({ 'application.instructor.crimeRecordConfirmed': true })
    expect(getGeneralApplicationOverlayRecord()['application.instructor.crimeRecordConfirmed']).toBe(
      true
    )
  })

  it('비활성 신청 유형 키는 선택 kv에서 빠진다', () => {
    const selected = selectApplicationKvForParticipant(
      {
        'application.institution.teacherTel': '기관',
        'application.volunteer.previousProgram.programName': '유령',
      },
      {
        organization: true,
        individual: false,
        teacherInstructor: false,
        volunteer: false,
      }
    )
    expect(selected['application.institution.teacherTel']).toBe('기관')
    expect(selected['application.volunteer.previousProgram.programName']).toBeUndefined()
  })

  it('개인 전용 hydrate는 구 institution 일정 키를 individual 키로만 복원한다', () => {
    const canonical = canonicalizeWizardApplicationKv(
      { 'application.institution.fixedScheduleSelected': ['slot-legacy'] },
      { organization: false, individual: true, teacherInstructor: false, volunteer: false }
    )
    expect(canonical['application.individual.fixedScheduleSelected']).toEqual(['slot-legacy'])
    expect(canonical['application.institution.fixedScheduleSelected']).toBeUndefined()
  })

  it('기관+개인 동시 선택 시 institution 일정 키를 individual로 복사하지 않는다', () => {
    const canonical = canonicalizeWizardApplicationKv(
      { 'application.institution.fixedScheduleSelected': ['slot-org'] },
      { organization: true, individual: true, teacherInstructor: false, volunteer: false }
    )
    expect(canonical['application.institution.fixedScheduleSelected']).toEqual(['slot-org'])
    expect(canonical['application.individual.fixedScheduleSelected']).toBeUndefined()
  })

  it('호환 peek는 stale Overlay 소유 키를 버리고 RHF만 남긴다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    act(() => {
      const rhf = peekGeneralRegistrationWizardRhf()
      const current = rhf!.getValues()
      rhf?.reset({
        ...current,
        extras: {
          ...current.extras,
          participant: { ...current.extras.participant, organization: true },
        },
        applicationKv: { 'application.institution.teacherEmail': 'RHF-정본' },
      })
      beginWizardApplicationRhfProjection()
      try {
        replaceGeneralApplicationOverlayForScope('application-participant-school', {
          'application.institution.teacherEmail': 'STALE',
          'application.institution.memo': 'keep-unowned',
        })
      } finally {
        endWizardApplicationRhfProjection()
      }
    })
    const peeked = peekGeneralApplicationOverlayRecord('application-participant-school')
    expect(peeked['application.institution.teacherEmail']).toBe('RHF-정본')
  })

  it('강사 슬롯 명시 해제는 빈 배열을 Form Version overlay에 남긴다', () => {
    const ui = createDefaultRegistrationWizardUiValues({
      participant: {
        organization: false,
        individual: false,
        teacherInstructor: true,
        volunteer: false,
      },
    })
    ui.applicationKv = { 'application.instructor.selectedSlotIds': [] }
    const overlay = collectWizardApplicationOverlayForCatalog('application-instructor', ui)
    expect(overlay?.['application.instructor.selectedSlotIds']).toEqual([])
  })

  it('봉사자 예외 블록 삭제는 Independent overlay에 되살리지 않는다', () => {
    const ui = createDefaultRegistrationWizardUiValues({
      participant: {
        organization: false,
        individual: false,
        teacherInstructor: false,
        volunteer: true,
      },
    })
    ui.applicationKv = {
      'application.volunteer.interview.exception.10.exceptionDate': '2026-06-11',
    }
    const overlay = collectWizardApplicationOverlayForCatalog('application-volunteer', ui)
    expect(overlay?.['application.volunteer.interview.exception.10.exceptionDate']).toBe(
      '2026-06-11'
    )
    expect(
      Object.keys(overlay ?? {}).some(key => key.includes('exception.20'))
    ).toBe(false)
  })

  it('프로그램 CREATE persist에 application.* 가 없다', () => {
    const ui = createDefaultRegistrationWizardUiValues({
      participant: {
        organization: true,
        individual: false,
        teacherInstructor: false,
        volunteer: false,
      },
    })
    ui.programTitleKo = '신청 혼입 금지'
    ui.applicationKv = { 'application.institution.teacherTel': '02-000' }
    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'app-not-in-create',
      uiValues: ui,
      overlay: { 'application.institution.teacherTel': '02-000' },
    })
    expect(JSON.stringify(created.persistOverlay).includes('application.')).toBe(false)
    expect(stripApplicationKeysFromOverlay(created.persistOverlay)).toEqual(created.persistOverlay)
  })

  it('thirdPartyRecipient는 WritingFormDraft 셀 검증을 유지한다', () => {
    const draft = createProgramApplicationFormInstitutionDraft()
    const keys = listIncompleteApplicationFormThirdPartyRecipientKeys(draft)
    expect(keys.length).toBeGreaterThan(0)
    expect(APPLICATION_FORM_THIRD_PARTY_RECIPIENT_PLACEHOLDER.length).toBeGreaterThan(0)
  })
})
