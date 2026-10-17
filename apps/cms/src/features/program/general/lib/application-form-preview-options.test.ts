import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import {
  resolveInstitutionFixedScheduleDescription,
  shouldUseInstitutionFixedScheduleCardCopy,
} from '@/features/template/lib/institution-application-schedule-copy'
import {
  buildGeneralApplicationFormPreviewParagraphBodyOptions,
  resolveGeneralApplicationFormHiddenParagraphIds,
} from './application-form-preview-options'
import { buildGeneralProgramListRowFromRegistrationSnapshot } from '@/features/program/general/lib/registration-local-save'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import {
  getInstitutionApplicationProgramBridge,
  resetInstitutionApplicationProgramBridge,
  resolveInstitutionApplicationProgramBridge,
} from './institution-application-program-bridge'
import { syncInstitutionApplicationBridgeForRegistrationWizard } from './registration-institution-bridge-sync'
import {
  GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY,
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

const individualOnlyParticipant: ProgramRegistrationParticipantState = {
  individual: true,
  organization: false,
  teacherInstructor: false,
  volunteer: false,
}

const emptyVm = {
  structureLockedParagraphIds: undefined,
  programApplicationFormInstructorOptions: { enabled: false as const },
  programApplicationFormVolunteerOptions: {
    enabled: false as const,
    exceptionScheduleCount: 0,
    exceptionScheduleAddDisabled: false,
    onAddExceptionSchedule: () => {},
    onCommonExclusionChange: undefined,
  },
}

describe('buildGeneralApplicationFormPreviewParagraphBodyOptions', () => {
  it('프로그램 상세 연동 미리보기는 공통정보 일정을 쓰고 schema 객관식 snapshot을 쓰지 않는다', () => {
    const program = {
      id: 'detail-preview-schedule',
      generalProgramAudience: 'individual',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        educationScheduleMode: 'date',
        educationScheduleLines: [
          '26년 9월 1일(화) 9:00 ~ 12:00',
          '26년 9월 8일(화) 13:00 ~ 16:00',
        ],
      },
    } as Program
    const institutionBridge = resolveInstitutionApplicationProgramBridge(program)

    const options = buildGeneralApplicationFormPreviewParagraphBodyOptions(
      'individual',
      emptyVm,
      {
        program,
        paragraphs: [],
        institutionBridge,
        programLinkedApplicationFormPreview: true,
      }
    )

    expect(options.applicationFormSchemaSnapshotPreview).toBeUndefined()
    expect(options.programLinkedIndividualApplicationForm).toBe(true)
    expect(options.institutionApplicationProgramBridge?.educationScheduleLines).toEqual([
      '26년 9월 1일(화) 9:00 ~ 12:00',
      '26년 9월 8일(화) 13:00 ~ 16:00',
    ])
    expect(institutionBridge.educationScheduleLines).toEqual([
      '26년 9월 1일(화) 9:00 ~ 12:00',
      '26년 9월 8일(화) 13:00 ~ 16:00',
    ])
    expect(options.hiddenParagraphIds?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)).toBe(
      false
    )
    expect(
      resolveGeneralApplicationFormHiddenParagraphIds('individual', {
        program,
        paragraphs: [],
        institutionBridge,
      })?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)
    ).toBe(false)
  })

  it('개인 · 커리큘럼 · 복수 · 날짜(2일) — scheduleChoice 노출·회차 메타', () => {
    const program = {
      id: 'individual-curriculum-multi-date',
      generalProgramAudience: 'individual',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalCommonInfo: {
        educationScheduleMode: 'date',
        educationScheduleLines: [
          '26년 4월 20일(월) 9:30 ~ 12:20',
          '26년 4월 27일(월) 13:00 ~ 15:50',
        ],
        curriculumSessions: [
          { sessionLabel: '1회차', title: '2' },
          { sessionLabel: '2회차', title: '2' },
        ],
      },
    } as Program
    const bridge = resolveInstitutionApplicationProgramBridge(program)
    expect(bridge.educationRoundCount).toBe(2)
    expect(bridge.sessionsPerRound).toBe(2)
    const hidden = resolveGeneralApplicationFormHiddenParagraphIds('individual', {
      program,
      paragraphs: [],
      institutionBridge: bridge,
    })
    expect(hidden?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)).toBe(false)
  })

  it('개인 · 일정형 · 단일 · 날짜(2일) — 1타임 설명·scheduleChoice 노출', () => {
    const program = {
      id: 'individual-schedule-single',
      generalProgramAudience: 'individual',
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        educationScheduleMode: 'date',
        educationScheduleLines: [
          '26년 4월 20일(월) 09:30 ~ 12:20',
          '26년 4월 27일(월) 13:00 ~ 15:50',
        ],
      },
    } as Program
    const bridge = resolveInstitutionApplicationProgramBridge(program)
    expect(bridge.educationStructure).toBe('schedule')
    expect(shouldUseInstitutionFixedScheduleCardCopy(bridge)).toBe(true)
    expect(resolveInstitutionFixedScheduleDescription(bridge)).toBe(
      '진행 가능한 일정을 모두 선택해 주세요. 모두 동일한 커리큘럼이며, 선택한 일정 중 1타임에 배정됩니다.'
    )
    const hidden = resolveGeneralApplicationFormHiddenParagraphIds('individual', {
      program,
      paragraphs: [],
      institutionBridge: bridge,
    })
    expect(hidden?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)).toBe(false)
  })

  it('개인 · 일정형 · 단일 · 날짜(같은 날 슬롯 2개) — scheduleChoice 노출', () => {
    const program = {
      id: 'individual-schedule-single-one-day',
      generalProgramAudience: 'individual',
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        educationScheduleMode: 'date',
        educationScheduleLines: [
          '26년 4월 20일(월) 09:30 ~ 12:20',
          '26년 4월 20일(월) 13:00 ~ 15:50',
        ],
      },
    } as Program
    const bridge = resolveInstitutionApplicationProgramBridge(program)
    const hidden = resolveGeneralApplicationFormHiddenParagraphIds('individual', {
      program,
      paragraphs: [],
      institutionBridge: bridge,
    })
    expect(hidden?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)).toBe(false)
  })

  it('개인 · 일정형 · 단일 · 날짜(슬롯 1개) — scheduleChoice 숨김', () => {
    const program = {
      id: 'individual-schedule-single-one-slot',
      generalProgramAudience: 'individual',
      generalProgramEducationStructure: 'schedule',
      generalProgramSessionRound: 'single',
      generalCommonInfo: {
        educationScheduleMode: 'date',
        educationScheduleLines: ['26년 4월 20일(월) 09:30 ~ 12:20'],
      },
    } as Program
    const bridge = resolveInstitutionApplicationProgramBridge(program)
    const hidden = resolveGeneralApplicationFormHiddenParagraphIds('individual', {
      program,
      paragraphs: [],
      institutionBridge: bridge,
    })
    expect(hidden?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)).toBe(true)
  })

  it('등록 위저드 sync 후 개인 신청 — 같은 날 슬롯 2개이면 scheduleChoice를 숨기지 않는다', () => {
    resetInstitutionApplicationProgramBridge()
    resetProgramRegistrationOverlay()
    replaceProgramRegistrationOverlay({
      [GENERAL_REGISTRATION_OVERLAY_SCHEDULE_LINES_KEY]: [
        '26년 4월 20일(월) 09:30 ~ 12:20',
        '26년 4월 20일(월) 13:00 ~ 15:50',
      ],
    })
    syncInstitutionApplicationBridgeForRegistrationWizard({
      registrationFormVariant: 'general',
      programType: 'curriculum',
      sessionRound: 'single',
      educationScheduleMode: 'date',
      recruitTemplateCode: 'recruitment-participant-school',
    })
    const bridge = getInstitutionApplicationProgramBridge()
    const options = buildGeneralApplicationFormPreviewParagraphBodyOptions('individual', emptyVm, {
      program: null,
      paragraphs: [],
      institutionBridge: bridge,
      programLinkedApplicationFormPreview: true,
    })
    expect(
      options.hiddenParagraphIds?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)
    ).toBeFalsy()
  })

  it('등록 스냅샷 — 개인 참여면 teamInfo를 숨기고 팀 참여면 노출한다', () => {
    resetProgramRegistrationOverlay()
    replaceProgramRegistrationOverlay({
      'generalRegistration.typeSettings.singleParticipation': 'individual',
    })
    const individualProgram = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'registration-wizard-individual',
      participant: individualOnlyParticipant,
      programType: 'curriculum',
      variant: 'general',
      sessionRoundType: 'single',
      editorExtras: {
        participationScheduleDetail: 'common',
        educationFormScheduleDetail: 'common',
        ipsScheduleDetail: 'common',
        participantOrganization: false,
      },
    })
    const individualHidden = resolveGeneralApplicationFormHiddenParagraphIds('individual', {
      program: individualProgram,
      paragraphs: [],
      institutionBridge: resolveInstitutionApplicationProgramBridge(individualProgram),
    })
    expect(individualHidden?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo)).toBe(true)

    resetProgramRegistrationOverlay()
    replaceProgramRegistrationOverlay({
      'generalRegistration.typeSettings.singleParticipation': 'team',
    })
    const teamProgram = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'registration-wizard-team',
      participant: individualOnlyParticipant,
      programType: 'curriculum',
      variant: 'general',
      sessionRoundType: 'single',
      editorExtras: {
        participationScheduleDetail: 'common',
        educationFormScheduleDetail: 'common',
        ipsScheduleDetail: 'common',
        participantOrganization: false,
      },
    })
    const teamHidden = resolveGeneralApplicationFormHiddenParagraphIds('individual', {
      program: teamProgram,
      paragraphs: [],
      institutionBridge: resolveInstitutionApplicationProgramBridge(teamProgram),
    })
    expect(teamHidden?.has(PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo)).toBe(false)
  })

  it('schema snapshot 플래그가 켜지면 일정 연동 UI를 끈다', () => {
    const options = buildGeneralApplicationFormPreviewParagraphBodyOptions(
      'individual',
      emptyVm,
      {
        paragraphs: [],
        programLinkedApplicationFormPreview: true,
        applicationFormPublishedSchemaSnapshotPreview: true,
      }
    )

    expect(options.applicationFormSchemaSnapshotPreview).toBe(true)
    expect(options.programLinkedIndividualApplicationForm).toBe(false)
  })
})
