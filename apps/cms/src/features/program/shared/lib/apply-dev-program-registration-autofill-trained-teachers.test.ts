import { describe, expect, it } from 'vitest'
import { listIncompleteTrainedTeachersProgramRegistrationRequiredFieldLabels } from '@/features/program/trained-teachers/lib/trained-teachers-program-registration-required-fields'
import {
  previewTrainedTeachersRegistrationDevAutofill,
  type ProgramRegistrationDevAutofillLayout,
  type ProgramRegistrationDevAutofillTypeSettings,
} from './apply-dev-program-registration-autofill'

const orgParticipant = {
  individual: false,
  organization: true,
  teacherInstructor: false,
  volunteer: false,
} as const

const resolved = {
  sponsorId: '',
  contactId: '',
  detailedProgramId: '163006',
  detailedProgramName: '1사1교 경제금융교육',
  paymentItemValues: ['pay-1'],
  paymentItemLabels: '강사비',
}

function layout(
  patch?: Partial<ProgramRegistrationDevAutofillLayout>
): ProgramRegistrationDevAutofillLayout {
  return {
    curriculumSessionCount: 2,
    curriculumChartSessionCount: 2,
    scheduleCurriculumDetailCount: 2,
    scheduleCurriculumGroupCount: 2,
    participantOrganization: true,
    programType: 'curriculum',
    sessionRoundType: 'single',
    teacherTrainingEnabled: false,
    participant: { ...orgParticipant },
    ...patch,
  }
}

function typeSettings(
  patch?: Partial<ProgramRegistrationDevAutofillTypeSettings>
): ProgramRegistrationDevAutofillTypeSettings {
  return {
    programType: 'curriculum',
    sessionRoundType: 'single',
    educationFormScheduleDetail: 'common',
    participationScheduleDetail: 'common',
    ipsScheduleDetail: 'common',
    educationForm: 'offline',
    participation: 'individual',
    educationScheduleMode: 'date',
    ...patch,
  }
}

describe('previewTrainedTeachersRegistrationDevAutofill', () => {
  it('유형·회차·교육 연수 조합에서 필수 항목을 비우지 않는다', () => {
    const programTypes = ['curriculum', 'schedule'] as const
    const rounds = ['single', 'multi'] as const
    const details = ['common', 'perSchedule'] as const
    const modes = ['date', 'period'] as const
    const trainingFlags = [false, true] as const

    for (const programType of programTypes) {
      for (const sessionRoundType of rounds) {
        for (const educationFormScheduleDetail of details) {
          for (const ipsScheduleDetail of details) {
            for (const educationScheduleMode of modes) {
              for (const teacherTrainingEnabled of trainingFlags) {
                const settings = typeSettings({
                  programType,
                  sessionRoundType,
                  educationFormScheduleDetail,
                  participationScheduleDetail: 'common',
                  ipsScheduleDetail,
                  educationScheduleMode,
                })
                const currentLayout = layout({
                  programType,
                  sessionRoundType,
                  teacherTrainingEnabled,
                })
                const built = previewTrainedTeachersRegistrationDevAutofill({
                  layout: currentLayout,
                  typeSettings: settings,
                  resolved,
                })
                const labels = listIncompleteTrainedTeachersProgramRegistrationRequiredFieldLabels(
                  built.overlay,
                  {
                    participant: { ...orgParticipant },
                    programType,
                    sessionRoundType,
                    educationFormScheduleDetail,
                    participationScheduleDetail: 'common',
                    ipsScheduleDetail,
                    curriculumSessionCount: currentLayout.curriculumSessionCount,
                    curriculumChartSessionCount: currentLayout.curriculumChartSessionCount,
                    scheduleCurriculumDetailCount: currentLayout.scheduleCurriculumDetailCount,
                    scheduleCurriculumGroupCount: currentLayout.scheduleCurriculumGroupCount,
                    teacherTrainingEnabled,
                    educationScheduleMode,
                    sponsorId: '',
                    sponsorContactId: '',
                    programTitleKo: built.programTitleKo,
                  }
                )
                expect(
                  labels,
                  `${programType}/${sessionRoundType}/${educationFormScheduleDetail}/ips:${ipsScheduleDetail}/${educationScheduleMode}/training:${teacherTrainingEnabled}`
                ).toEqual([])
              }
            }
          }
        }
      }
    }
  })

  it('커리큘럼형인데 세부 프로그램 마스터 id가 없으면 그 항목만 남긴다', () => {
    const settings = typeSettings()
    const built = previewTrainedTeachersRegistrationDevAutofill({
      layout: layout(),
      typeSettings: settings,
      resolved: { ...resolved, detailedProgramId: '', detailedProgramName: '' },
    })
    expect(
      listIncompleteTrainedTeachersProgramRegistrationRequiredFieldLabels(built.overlay, {
        participant: { ...orgParticipant },
        programType: 'curriculum',
        sessionRoundType: 'single',
        educationFormScheduleDetail: 'common',
        participationScheduleDetail: 'common',
        ipsScheduleDetail: 'common',
        curriculumSessionCount: 2,
        curriculumChartSessionCount: 2,
        scheduleCurriculumDetailCount: 2,
        scheduleCurriculumGroupCount: 2,
        teacherTrainingEnabled: false,
        educationScheduleMode: 'date',
        sponsorId: '',
        sponsorContactId: '',
        programTitleKo: built.programTitleKo,
      })
    ).toEqual(['세부 프로그램명'])
  })
})
