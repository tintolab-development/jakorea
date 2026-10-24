/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { mapGeneralProgramToCreateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import { listIncompleteGeneralProgramRecruitmentRequiredFields } from '@/features/program/general/lib/registration-recruitment-required-fields'
import { useRegistrationWizardLeaveGuard } from '@/features/program/shared/lib/registration-wizard-leave-guard'
import {
  flushRecruitDetailRichTextIntoGeneralRecruitOverlay,
  registerRecruitDetailRichTextHtml,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import {
  getGeneralRecruitOverlayRecord,
  peekGeneralRecruitOverlayRecord,
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
  setGeneralRecruitOverlayScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  beginWizardRecruitmentRhfProjection,
  endWizardRecruitmentRhfProjection,
} from './registration-wizard-recruitment-rhf'
import {
  getGeneralApplicationOverlayRecord,
  peekGeneralApplicationOverlayRecord,
  replaceGeneralApplicationOverlayForScope,
  resetGeneralApplicationOverlayStoreForTests,
  setGeneralApplicationOverlayScope,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { GeneralRegistrationWizardFormProvider } from '@/features/program/general/ui/registration/registration-wizard-form-provider'
import { INDIVIDUAL_APPLICATION_STATIC_KEYS } from './application-domain'
import { buildGeneralProgramCreateFromWizardRhf } from './build-registration-create-from-rhf'
import { COMMON_INFO_PERSIST_KEYS as K } from './common-info-persist-keys'
import { collectWizardApplicationOverlayForCatalog } from './registration-wizard-application-from-rhf'
import {
  beginWizardApplicationRhfProjection,
  endWizardApplicationRhfProjection,
  INDIVIDUAL_APPLICATION_FIXED_SCHEDULE_KEY,
  INSTITUTION_APPLICATION_FIXED_SCHEDULE_KEY,
} from './registration-wizard-application-rhf'
import {
  hydrateRegistrationWizardUiValues,
  parseRegistrationWizardRhfSettings,
} from './registration-wizard-legacy-hydrate'
import { peekGeneralRegistrationWizardRhf, registerGeneralRegistrationWizardRhf } from './registration-wizard-rhf-api'
import {
  createDefaultRegistrationWizardUiValues,
  REGISTRATION_WIZARD_RHF_SETTINGS_KEY,
} from './registration-wizard-ui-values'
import { stripApplicationKeysFromOverlay } from './registration-wizard-ui-to-common-info'

const RANGE = { start: '2026-05-01T00:00:00.000Z', end: '2026-05-31T00:00:00.000Z' }
const PROGRAM_RANGE = { start: '2026-06-01T00:00:00.000Z', end: '2026-08-31T00:00:00.000Z' }

const TITLE = 'P3-RHF-정본-제목'

function orgParticipant() {
  return {
    organization: true,
    individual: false,
    teacherInstructor: false,
    volunteer: false,
  } as const
}

function dualParticipant() {
  return {
    organization: true,
    individual: true,
    teacherInstructor: true,
    volunteer: true,
  } as const
}

function filledUi() {
  const ui = createDefaultRegistrationWizardUiValues({
    programType: 'curriculum',
    sessionRoundType: 'single',
    curriculumChartSessionCount: 2,
    participant: dualParticipant(),
  })
  ui.programTitleKo = TITLE
  ui.programTitleEn = 'P3 Title'
  ui.publicProgramTitle = 'P3 공고'
  ui.sponsorId = '163001'
  ui.sponsorIds = ['163001']
  ui.curriculum.unitNameBySession = { 1: '단원1', 2: '단원2' }
  ui.recruitmentKv = {
    'recruit.inquiryTel': '02-111-1111',
    'recruit.inquiryEmail': 'org@example.com',
    'recruit.inquiryContact': '기관담당',
    'recruit.announcementPublished': 'published',
    'recruit.recruitRangeSeal': RANGE,
    'recruit.programRangeSeal': PROGRAM_RANGE,
    'recruit.detailInfo.programDescription': '<p>RHF 설명</p>',
    'recruit.individual.inquiryTel': '010-0000-0000',
    'recruit.individual.announcementPublished': 'published',
    'recruit.individual.recruitRangeSeal': RANGE,
    'recruit.individual.programRangeSeal': PROGRAM_RANGE,
    'recruit.instructor.inquiryTel': '02-222-2222',
    'recruit.instructor.announcementPublished': 'published',
    'recruit.instructor.recruitRangeSeal': RANGE,
    'recruit.instructor.programRangeSeal': PROGRAM_RANGE,
    'recruit.volunteer.inquiryTel': '02-333-3333',
    'recruit.volunteer.announcementPublished': 'published',
    'recruit.volunteer.interviewRequired': 'yes',
    'recruit.volunteer.recruitRangeSeal': RANGE,
    'recruit.volunteer.programRangeSeal': PROGRAM_RANGE,
    'recruitVolunteer.detailInfo.programDescription': '<p>봉사</p>',
  }
  ui.applicationKv = {
    'application.institution.teacherTel': '02-111-1111',
    'application.institution.fixedScheduleSelected': ['slot-org'],
    'application.individual.teamInfo.teamName': '팀A',
    'application.individual.fixedScheduleSelected': ['slot-ind'],
    'application.instructor.selectedSlotIds': ['s1'],
    'application.volunteer.previousProgram.programName': 'JA',
    'application.volunteer.interview.exception.10.exceptionDate': '2026-06-11',
  }
  return ui
}

describe('P3 일반 신규 등록 RHF 통합 정본', () => {
  afterEach(() => {
    cleanup()
    registerGeneralRegistrationWizardRhf(null)
    resetGeneralRecruitOverlayStoreForTests()
    resetGeneralApplicationOverlayStoreForTests()
    registerRecruitDetailRichTextHtml('recruit.detailInfo.programDescription', null)
  })

  it('stale Overlay를 주입해도 공통·모집·신청 읽기·CREATE·Form Version은 RHF를 따른다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    const ui = filledUi()
    act(() => {
      peekGeneralRegistrationWizardRhf()?.reset(ui, { keepDirty: true })
    })

    act(() => {
      setGeneralRecruitOverlayScope('recruitment-participant-school')
      beginWizardRecruitmentRhfProjection()
      try {
        replaceGeneralRecruitOverlayForScope('recruitment-participant-school', {
          'recruit.inquiryTel': 'STALE-RECRUIT',
          'recruit.detailInfo.programDescription': '<p>stale html</p>',
        })
      } finally {
        endWizardRecruitmentRhfProjection()
      }
      setGeneralApplicationOverlayScope('application-participant-school')
      beginWizardApplicationRhfProjection()
      try {
        replaceGeneralApplicationOverlayForScope('application-participant-school', {
          'application.institution.teacherTel': 'STALE-APP',
          'application.institution.fixedScheduleSelected': ['stale-org'],
        })
      } finally {
        endWizardApplicationRhfProjection()
      }
    })

    expect(peekGeneralRegistrationWizardRhf()?.getValues().programTitleKo).toBe(TITLE)
    expect(peekGeneralRegistrationWizardRhf()?.getValues().recruitmentKv['recruit.inquiryTel']).toBe(
      '02-111-1111'
    )
    expect(
      peekGeneralRegistrationWizardRhf()?.getValues().applicationKv[
        'application.institution.teacherTel'
      ]
    ).toBe('02-111-1111')
    expect(getGeneralRecruitOverlayRecord()['recruit.inquiryTel']).toBe('STALE-RECRUIT')
    expect(getGeneralApplicationOverlayRecord()['application.institution.teacherTel']).toBe(
      'STALE-APP'
    )
    expect(peekGeneralRecruitOverlayRecord('recruitment-participant-school')['recruit.inquiryTel']).toBe(
      '02-111-1111'
    )
    expect(
      peekGeneralApplicationOverlayRecord('application-participant-school')[
        'application.institution.teacherTel'
      ]
    ).toBe('02-111-1111')

    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'p3-stale',
      uiValues: peekGeneralRegistrationWizardRhf()!.getValues(),
      overlay: {
        [K.programTitleKo]: 'overlay-title',
        'recruit.inquiryTel': 'STALE-RECRUIT',
        'application.institution.teacherTel': 'STALE-APP',
      },
    })
    expect(created.program.mainTitle).toBe(TITLE)
    expect(created.persistOverlay['recruit.inquiryTel']).toBe('02-111-1111')
    expect(created.persistOverlay[K.programTitleKo]).toBe(TITLE)
    expect(JSON.stringify(created.persistOverlay)).not.toContain('application.')
    expect(JSON.stringify(created.createRequest)).not.toContain('application.')
    expect(stripApplicationKeysFromOverlay(created.persistOverlay)).toEqual(created.persistOverlay)

    const school = collectWizardApplicationOverlayForCatalog(
      'application-participant-school',
      peekGeneralRegistrationWizardRhf()!.getValues()
    )
    expect(school?.['application.institution.teacherTel']).toBe('02-111-1111')
    expect(school?.['application.institution.fixedScheduleSelected']).toEqual(['slot-org'])
    expect(school?.['application.individual.fixedScheduleSelected']).toBeUndefined()
  })

  it('Rich Text flush 후 CREATE persist는 최신 HTML이고 모집 필수검사는 RHF kv를 본다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    act(() => {
      peekGeneralRegistrationWizardRhf()?.reset(filledUi(), { keepDirty: true })
    })
    registerRecruitDetailRichTextHtml(
      'recruit.detailInfo.programDescription',
      () => '<p>flush-latest</p>'
    )
    act(() => {
      flushRecruitDetailRichTextIntoGeneralRecruitOverlay()
    })
    expect(
      peekGeneralRegistrationWizardRhf()?.getValues().recruitmentKv[
        'recruit.detailInfo.programDescription'
      ]
    ).toBe('<p>flush-latest</p>')

    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'p3-richtext',
      uiValues: peekGeneralRegistrationWizardRhf()!.getValues(),
    })
    expect(created.persistOverlay['recruit.detailInfo.programDescription']).toBe('<p>flush-latest</p>')
    expect(created.program.generalCommonInfo?.participantRecruitmentInfo?.programDescription).toBe(
      '<p>flush-latest</p>'
    )

    const missing = listIncompleteGeneralProgramRecruitmentRequiredFields({
      participant: orgParticipant(),
      programType: 'curriculum',
      sessionRoundType: 'single',
      educationScheduleMode: 'date',
      volunteerExceptionScheduleCount: 0,
      registrationProgramType: 'GENERAL',
    })
    expect(missing).not.toContain('recruit.inquiryTel')
  })

  it('봉사자 예외 블록 삭제와 개인 일정 키는 catalog별로 격리되고 CREATE에 신청 키가 없다', () => {
    const ui = filledUi()
    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'p3-catalogs',
      uiValues: ui,
    })
    expect(created.program.generalCommonInfo?.curriculumSessions?.map(row => row.title)).toEqual([
      '단원1',
      '단원2',
    ])
    expect(mapGeneralProgramToCreateRequest(created.program).autoApplyDefaultFormBindings).toBe(true)

    const volunteer = collectWizardApplicationOverlayForCatalog('application-volunteer', ui)
    expect(volunteer?.['application.volunteer.interview.exception.10.exceptionDate']).toBe(
      '2026-06-11'
    )
    expect(Object.keys(volunteer ?? {}).some(key => key.includes('exception.20'))).toBe(false)

    const individual = collectWizardApplicationOverlayForCatalog(
      'application-participant-individual',
      ui
    )
    expect(individual?.[INDIVIDUAL_APPLICATION_FIXED_SCHEDULE_KEY]).toEqual(['slot-ind'])
    expect(individual?.[INSTITUTION_APPLICATION_FIXED_SCHEDULE_KEY]).toBeUndefined()
    expect(INDIVIDUAL_APPLICATION_STATIC_KEYS.fixedScheduleSelected).toBe(
      INDIVIDUAL_APPLICATION_FIXED_SCHEDULE_KEY
    )

    const instructor = collectWizardApplicationOverlayForCatalog('application-instructor', ui)
    expect(instructor?.['application.instructor.selectedSlotIds']).toEqual(['s1'])
    expect(collectWizardApplicationOverlayForCatalog('application-ujat-volunteer', ui)).toBeNull()

    const unselected = createDefaultRegistrationWizardUiValues({
      participant: orgParticipant(),
    })
    expect(collectWizardApplicationOverlayForCatalog('application-volunteer', unselected)).toEqual(
      {}
    )
  })

  it('blob URL은 persist되지 않고 thumbnail fileObjectId는 유지된다', () => {
    const ui = filledUi()
    const created = buildGeneralProgramCreateFromWizardRhf({
      id: 'p3-media',
      uiValues: ui,
      overlay: {
        'recruit.detailInfo.thumbFileObjectId': 'file-thumb-1',
        'recruit.detailInfo.thumbObjectUrl': 'blob:http://localhost/thumb',
        'recruit.detailInfo.keyVisualImage': 'blob:http://localhost/kv',
        extraBlob: 'blob:http://localhost/extra',
        extraFile: 'file-keep',
      },
    })
    expect(created.persistOverlay['recruit.detailInfo.thumbFileObjectId']).toBe('file-thumb-1')
    expect(JSON.stringify(created.persistOverlay)).not.toContain('blob:')
    expect(created.persistOverlay.extraBlob).toBeUndefined()
    expect(created.persistOverlay.extraFile).toBe('file-keep')
  })

  it('임시저장 settingsJson이 overlay stale 값보다 우선 복원된다', () => {
    const saved = filledUi()
    const restored = hydrateRegistrationWizardUiValues({
      overlay: {
        [K.programTitleKo]: 'overlay-draft',
        'recruit.inquiryTel': 'STALE',
        'application.institution.teacherTel': 'STALE',
      },
      settingsJson: {
        [REGISTRATION_WIZARD_RHF_SETTINGS_KEY]: saved,
      },
    })
    expect(restored.programTitleKo).toBe(TITLE)
    expect(restored.recruitmentKv['recruit.inquiryTel']).toBe('02-111-1111')
    expect(restored.applicationKv['application.institution.teacherTel']).toBe('02-111-1111')
    expect(parseRegistrationWizardRhfSettings({ nope: true })).toBeNull()
  })

  it('leave guard는 RHF dirty를 따르고 markBaseline 이후 이탈을 막지 않는다', () => {
    render(<GeneralRegistrationWizardFormProvider>ok</GeneralRegistrationWizardFormProvider>)
    act(() => {
      peekGeneralRegistrationWizardRhf()?.setPath('programTitleKo', TITLE, { shouldDirty: true })
    })
    expect(peekGeneralRegistrationWizardRhf()?.isDirty()).toBe(true)

    const { result } = renderHook(() =>
      useRegistrationWizardLeaveGuard({
        open: true,
        onLeave: () => undefined,
        isDirtyOverride: () => peekGeneralRegistrationWizardRhf()?.isDirty() === true,
      })
    )
    act(() => {
      result.current.requestLeave()
    })
    expect(result.current.leaveConfirmOpen).toBe(true)

    act(() => {
      peekGeneralRegistrationWizardRhf()?.markBaseline()
      result.current.cancelLeave()
    })
    expect(peekGeneralRegistrationWizardRhf()?.isDirty()).toBe(false)
    act(() => {
      result.current.requestLeave()
    })
    expect(result.current.leaveConfirmOpen).toBe(false)
  })

  it('포털 Form Renderer는 개인 일정 overlay 키를 기관 키로 재매핑하지 않는다', () => {
    const paragraph = readFileSync(
      path.join(
        __dirname,
        '../../../../template/ui/form-set/application-form/individual/paragraphs/individual-schedule-paragraph.tsx'
      ),
      'utf8'
    )
    expect(paragraph).toContain('overlayKey="application.individual.fixedScheduleSelected"')
    expect(paragraph).not.toContain('overlayKey="application.institution.fixedScheduleSelected"')
  })
})
