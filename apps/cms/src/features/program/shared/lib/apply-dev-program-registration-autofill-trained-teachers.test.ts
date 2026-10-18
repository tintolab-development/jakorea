import { describe, expect, it } from 'vitest'
import {
  resolveTrainedTeachersRegistrationDevAutofillPreset,
  TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_IDS,
} from '@/features/program/trained-teachers/lib/registration-dev-autofill-cases'
import { listIncompleteTrainedTeachersProgramRegistrationRequiredFieldLabels } from '@/features/program/trained-teachers/lib/trained-teachers-program-registration-required-fields'
import {
  previewTrainedTeachersRegistrationDevAutofillForCase,
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
  it('TCH-01~07 preset이 유형·회차·일정 모드·행 수를 독립적으로 정의한다', () => {
    const expected = [
      ['curriculum', 'single', 'date', 2, 1],
      ['curriculum', 'single', 'period', 2, 1],
      ['curriculum', 'multi', 'date', 2, 1],
      ['curriculum', 'multi', 'period', 2, 1],
      ['schedule', 'single', 'date', 1, 1],
      ['schedule', 'single', 'period', 1, 1],
      ['schedule', 'multi', 'date', 1, 2],
    ] as const

    for (const [index, caseId] of TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_IDS.entries()) {
      const preset = resolveTrainedTeachersRegistrationDevAutofillPreset(caseId)
      expect([
        preset.typeSettings.programType,
        preset.typeSettings.sessionRoundType,
        preset.typeSettings.educationScheduleMode,
        preset.layout.curriculumChartSessionCount,
        preset.layout.scheduleCurriculumDetailCount,
      ]).toEqual(expected[index])
      expect(preset.participantFlags).toEqual(orgParticipant)
    }
  })

  it('7개 preset은 기본 교육일지와 TCH-07 직접 일정 데이터를 생성한다', () => {
    for (const caseId of TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_IDS) {
      const built = previewTrainedTeachersRegistrationDevAutofillForCase(caseId, resolved)
      expect(
        built.overlay['trainedTeachersRegistration.educationCurriculum.educationJournalEnabled']
      ).toBe('yes')
    }

    const tch07 = previewTrainedTeachersRegistrationDevAutofillForCase(7, resolved)
    expect(
      tch07.overlay['trainedTeachersRegistration.educationScheduleSettings.scheduleLines']
    ).toBeUndefined()
    expect(
      tch07.overlay['generalRegistration.educationScheduleCurriculum.eventNameByDetail']
    ).toEqual(expect.objectContaining({ 1: expect.any(String), 2: expect.any(String) }))
    expect(
      tch07.overlay['generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso']
    ).toEqual(
      expect.objectContaining({
        1: expect.stringMatching(/\d{1,2}:\d{2}/),
        2: expect.stringMatching(/\d{1,2}:\d{2}/),
      })
    )
  })

  it('교육일지 없음과 교육 연수 ON/OFF를 preset preview에 주입할 수 있다', () => {
    const withoutJournal = previewTrainedTeachersRegistrationDevAutofillForCase(1, resolved, {
      educationJournalEnabled: 'no',
    })
    expect(
      withoutJournal.overlay[
        'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled'
      ]
    ).toBe('no')

    const withTraining = previewTrainedTeachersRegistrationDevAutofillForCase(3, resolved, {
      teacherTrainingEnabled: true,
    })
    expect(withTraining.layout.teacherTrainingEnabled).toBe(true)
    expect(
      withTraining.overlay[
        'trainedTeachersRegistration.educationCurriculum.preEducationScheduleName'
      ]
    ).toBe('교육 연수')
    expect(
      withTraining.overlay[
        'trainedTeachersRegistration.educationCurriculum.preEducationScheduleLine'
      ]
    ).toMatch(/\d{1,2}:\d{2}/)
  })

  it.each(
    TRAINED_TEACHERS_REGISTRATION_DEV_AUTOFILL_CASE_IDS.flatMap(caseId =>
      ([false, true] as const).flatMap(teacherTrainingEnabled =>
        (['no', 'yes'] as const).map(educationJournalEnabled => ({
          caseId,
          teacherTrainingEnabled,
          educationJournalEnabled,
        }))
      )
    )
  )(
    'TCH-%02d x 교육 연수 %s x 교육일지 %s 조합이 화면·overlay 필수값을 채운다',
    ({ caseId, teacherTrainingEnabled, educationJournalEnabled }) => {
      const built = previewTrainedTeachersRegistrationDevAutofillForCase(caseId, resolved, {
        teacherTrainingEnabled,
        educationJournalEnabled,
      })
      const preset = resolveTrainedTeachersRegistrationDevAutofillPreset(caseId)
      const journalKey = 'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled'

      expect(built.layout.teacherTrainingEnabled).toBe(teacherTrainingEnabled)
      expect(built.typeSettings).toEqual(preset.typeSettings)
      expect(built.overlay[journalKey]).toBe(educationJournalEnabled)
      expect(built.overlay['generalRegistration.educationCurriculum.educationJournalEnabled']).toBe(
        educationJournalEnabled
      )
      expect(
        Object.keys(built.overlay).some(
          key =>
            key.startsWith('generalRegistration.kpi.') ||
            key.startsWith('generalRegistration.wageInfo.')
        )
      ).toBe(false)

      const labels = listIncompleteTrainedTeachersProgramRegistrationRequiredFieldLabels(
        built.overlay,
        {
          participant: { ...orgParticipant },
          programType: built.typeSettings.programType,
          sessionRoundType: built.typeSettings.sessionRoundType,
          educationFormScheduleDetail: built.typeSettings.educationFormScheduleDetail,
          participationScheduleDetail: built.typeSettings.participationScheduleDetail,
          ipsScheduleDetail: built.typeSettings.ipsScheduleDetail,
          curriculumSessionCount: built.layout.curriculumSessionCount,
          curriculumChartSessionCount: built.layout.curriculumChartSessionCount,
          scheduleCurriculumDetailCount: built.layout.scheduleCurriculumDetailCount,
          scheduleCurriculumGroupCount: built.layout.scheduleCurriculumGroupCount,
          teacherTrainingEnabled,
          educationScheduleMode: built.typeSettings.educationScheduleMode,
          sponsorId: '',
          sponsorContactId: '',
          programTitleKo: built.programTitleKo,
        }
      )
      expect(labels).toEqual([])

      if (caseId === 7) {
        expect(
          built.overlay['trainedTeachersRegistration.educationScheduleSettings.scheduleLines']
        ).toBeUndefined()
      }
    }
  )

  it('교육받은 교사 전용 샘플과 폼 계약만 생성한다', () => {
    const built = previewTrainedTeachersRegistrationDevAutofill({
      layout: layout(),
      typeSettings: typeSettings(),
      resolved,
    })

    expect(built.programTitleKo).toContain('교사')
    expect(built.overlay['trainedTeachersRegistration.basicInfo.businessField']).toBe(
      'economy_finance'
    )
    expect(built.overlay['trainedTeachersRegistration.basicInfo.educationCourse']).toBe(
      'digital_computer'
    )
    expect(
      built.overlay['trainedTeachersRegistration.educationCurriculum.educationJournalEnabled']
    ).toBe('yes')

    expect(
      Object.keys(built.overlay).some(
        key =>
          key.startsWith('generalRegistration.kpi.') ||
          key.startsWith('generalRegistration.wageInfo.')
      )
    ).toBe(false)
  })

  it('교육 연수 ON일 때만 시간 포함 교육 연수 일정을 기록한다', () => {
    const built = previewTrainedTeachersRegistrationDevAutofill({
      layout: layout({ teacherTrainingEnabled: true }),
      typeSettings: typeSettings({ educationScheduleMode: 'period' }),
      resolved,
    })

    expect(
      built.overlay['trainedTeachersRegistration.educationCurriculum.preEducationScheduleName']
    ).toBe('교육 연수')
    expect(
      built.overlay['trainedTeachersRegistration.educationCurriculum.preEducationScheduleLine']
    ).toMatch(/\d{2}:\d{2}/)
  })

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
