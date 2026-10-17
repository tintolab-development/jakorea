import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { applyGeneralRegistrationOverlayToProgram } from '@/features/program/general/lib/registration-overlay-to-program'
import { buildGeneralProgramListRowFromRegistrationSnapshot } from '@/features/program/general/lib/registration-local-save'
import {
  replaceProgramRegistrationOverlay,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'

const organizationOnlyParticipant: ProgramRegistrationParticipantState = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
}

function baseProgram(): Program {
  return {
    id: 'prog-smoke',
    sponsorId: '',
    title: 't',
    mainTitle: 'm',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    startDate: '2026-01-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    applicationStartDate: '2026-01-01T00:00:00.000Z',
    applicationEndDate: '2026-12-31T23:59:59.999Z',
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: '경제금융',
    targetLevel: 'elementary',
    approvedStudentCount: 0,
    instructors: 0,
    participatingSchoolCount: 0,
    participatingStudentCount: 0,
    scheduleTimeEnabled: true,
    startTime: '09:00',
    endTime: '18:00',
    studentListRequired: 'required',
    generalProgramAudience: 'organization',
    generalParticipantTypes: ['school_institution'],
  } as Program
}

const extras: GeneralRegistrationEditorExtras = {
  programType: 'curriculum',
  sessionRoundType: 'single',
  ipsScheduleDetail: 'common',
  curriculumSessionCount: 1,
  curriculumChartSessionCount: 1,
  participantOrganization: true,
}

describe('등록 payload 스모크 — sponsor·detailedProgram·wage', () => {
  it('applyGeneralRegistrationOverlayToProgram — 후원사 multi·세부프로그램·지급항목', () => {
    const overlay = {
      'generalRegistration.basicInfo.localSponsorIds': ['163001', '163002'],
      'generalRegistration.basicInfo.detailedProgramId': '163007',
      'generalRegistration.basicInfo.detailedProgramName': '대학생 멘토링',
      'generalRegistration.wageInfo.paymentItemValues': ['traffic'],
      'generalRegistration.wageInfo.paymentItemLabels': '교통비',
    }
    const applied = applyGeneralRegistrationOverlayToProgram(baseProgram(), overlay, extras)
    expect(applied.sponsorId).toBe('163001')
    expect(applied.generalCommonInfo?.sponsorManagementIds).toEqual(['163001', '163002'])
    expect(applied.detailedProgramId).toBe('163007')
    expect(applied.generalCommonInfo?.detailedProgramName).toBe('대학생 멘토링')
    expect(applied.generalCommonInfo?.paymentItems).toBe('교통비')
  })

  it('buildGeneralProgramListRowFromRegistrationSnapshot — 일반 후원사 multi overlay', () => {
    resetProgramRegistrationOverlay()
    replaceProgramRegistrationOverlay({
      'generalRegistration.basicInfo.localSponsorIds': ['sp-a', 'sp-b'],
      'generalRegistration.basicInfo.detailedProgramId': 'dp-x',
      'generalRegistration.basicInfo.detailedProgramName': '세부 스모크',
    })

    const program = buildGeneralProgramListRowFromRegistrationSnapshot({
      id: 'general-payload-smoke',
      participant: organizationOnlyParticipant,
      programType: 'curriculum',
      variant: 'general',
      sessionRoundType: 'single',
    })

    expect(program.generalCommonInfo?.sponsorManagementIds).toEqual(['sp-a', 'sp-b'])
    expect(program.detailedProgramId).toBe('dp-x')
    expect(program.generalCommonInfo?.detailedProgramName).toBe('세부 스모크')
  })
})
