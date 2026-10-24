import { describe, expect, it } from 'vitest'
import { mapTrainedTeacherToCreateRequest } from '@/features/program/trained-teachers/api/adapters'
import { buildTrainedTeachersProgramFromRhf } from './build-registration-create-from-canonical'
import { collectTrainedTeachersCommonInfoState } from './collect-registration-common-info-state'
import { importLegacyOverlayToTrainedTeachersCanonical } from './import-legacy-registration-overlay'
import {
  applyTrainedTeachersRhfOverlayRecord,
  createDefaultTrainedTeachersRegistrationRhfValues,
  isTrainedTeachersRegistrationCanonicalSnapshot,
  omitTrainedTeachersCommonInfoOverlayKeys,
  projectTrainedTeachersRhfToOverlayRecord,
  readTrainedTeachersRhfOverlayValue,
  rhfValuesFromTrainedTeachersCanonicalCommon,
  writeTrainedTeachersRhfOverlayValue,
} from './registration-rhf-values'
import { describeIncompleteTrainedTeachersRegistrationRhfRequiredFields } from './trained-teachers-program-registration-required-fields'

function filledRhf(): ReturnType<typeof createDefaultTrainedTeachersRegistrationRhfValues> {
  const values = createDefaultTrainedTeachersRegistrationRhfValues()
  return {
    ...values,
    title: 'RHF 제목',
    mainTitle: 'RHF 제목',
    announcementTitle: 'RHF 공고명',
    textbookName: 'RHF 교재',
    detailedProgramId: '163009',
    detailedProgramName: 'RHF 세부',
    businessArea: '경제금융',
    sponsorManagementIds: ['sponsor-rhf'],
    sponsorManagerContactIds: ['contact-rhf'],
    educationJournalEnabled: false,
    teacherTrainingEnabled: false,
    generalSurveyMenuKeys: [],
    curriculumSessions: [{ sessionLabel: '1차시', title: 'RHF 단원', description: '' }],
  }
}

describe('TT 등록 공통정보 RHF SSOT', () => {
  it('기간형 일정 줄에서 educationScheduleRange를 산출한다', () => {
    const values = {
      ...filledRhf(),
      educationScheduleMode: 'period' as const,
      educationScheduleLines: ['2026.11.11(수) ~ 2026.11.18(수)'],
    }
    const collected = collectTrainedTeachersCommonInfoState(values)
    const seoulDay = (iso: string) =>
      new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
    expect(seoulDay(collected.educationScheduleRange!.start)).toBe('2026-11-11')
    expect(seoulDay(collected.educationScheduleRange!.end)).toBe('2026-11-18')
    const program = buildTrainedTeachersProgramFromRhf({ id: 'tt-rhf', values })
    expect(seoulDay(program.generalCommonInfo!.educationScheduleRange!.start)).toBe('2026-11-11')
  })

  it('RHF와 Overlay가 달라도 화면·CREATE는 RHF를 쓴다', () => {
    const values = filledRhf()
    const overlay = {
      'trainedTeachersRegistration.basicInfo.programTitleKo': '오래된 제목',
      'trainedTeachersRegistration.basicInfo.publicProgramTitle': '오래된 공고명',
      'trainedTeachersRegistration.basicInfo.textbookName': '오래된 교재',
      'trainedTeachersRegistration.basicInfo.sponsorIds': ['old-sponsor'],
      'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled': true,
      'trainedTeachersRegistration.basicInfo.surveyItems': {
        survey: true,
        satisfaction: true,
        lecture_evaluation: true,
      },
    }
    const afterOverlayWrite = applyTrainedTeachersRhfOverlayRecord(values, overlay)
    expect(afterOverlayWrite.title).toBe('오래된 제목')

    const collected = collectTrainedTeachersCommonInfoState(values)
    expect(collected.title).toBe('RHF 제목')
    expect(collected.announcementTitle).toBe('RHF 공고명')
    expect(collected.textbookName).toBe('RHF 교재')
    expect(collected.sponsorManagementIds).toEqual(['sponsor-rhf'])
    expect(collected.educationJournalEnabled).toBe(false)
    expect(collected.generalSurveyMenuKeys).toEqual([])

    const program = buildTrainedTeachersProgramFromRhf({ id: 'tt-rhf', values })
    expect(program.title).toContain('RHF')
    expect(program.textbookName).toBe('RHF 교재')
    expect(program.generalSurveyMenuKeys).toEqual([])
    expect(program.generalCommonInfo?.educationJournalEnabled).toBe(false)
    expect(program.generalCommonInfo?.sponsorManagementIds).toEqual(['sponsor-rhf'])
  })

  it('명시적 [] / false 는 Legacy Overlay를 복원하지 않는다', () => {
    const values = {
      ...filledRhf(),
      sponsorManagementIds: [],
      sponsorManagerContactIds: [],
      educationJournalEnabled: false,
      generalSurveyMenuKeys: [],
    }
    const stale = applyTrainedTeachersRhfOverlayRecord(createDefaultTrainedTeachersRegistrationRhfValues(), {
      'trainedTeachersRegistration.basicInfo.sponsorIds': ['old'],
      'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled': true,
      'trainedTeachersRegistration.basicInfo.surveyItems': {
        survey: true,
        satisfaction: true,
        lecture_evaluation: true,
      },
    })
    expect(stale.sponsorManagementIds).toEqual(['old'])
    expect(stale.educationJournalEnabled).toBe(true)

    const collected = collectTrainedTeachersCommonInfoState(values)
    expect(collected.sponsorManagementIds).toEqual([])
    expect(collected.educationJournalEnabled).toBe(false)
    expect(collected.generalSurveyMenuKeys).toEqual([])
  })

  it('공고용 프로그램명 명시적 빈 값을 기존 제목으로 되돌리지 않는다', () => {
    const values = { ...filledRhf(), announcementTitle: '' }
    const program = buildTrainedTeachersProgramFromRhf({ id: 'tt-rhf', values })
    expect(program.generalCommonInfo?.announcementTitle).toBe('')
    const required = describeIncompleteTrainedTeachersRegistrationRhfRequiredFields(values)
    expect(required).toBeTruthy()
  })

  it('신규 typed snapshot이 있으면 Legacy overlay를 무시한다', () => {
    const typed = {
      schemaVersion: 1 as const,
      editor: {
        educationStructure: 'curriculum' as const,
        sessionRound: 'single' as const,
        educationFormScheduleDetail: 'common' as const,
        participationScheduleDetail: 'common' as const,
        ipsScheduleDetail: 'common' as const,
        curriculumSessionCount: 1,
        curriculumChartSessionCount: 1,
        scheduleCurriculumDetailCount: 1,
        scheduleCurriculumGroupCount: 1,
        educationScheduleMode: 'date' as const,
        teacherTrainingEnabled: false,
        participant: {
          individual: false,
          organization: true,
          teacherInstructor: false,
          volunteer: false,
        },
      },
      common: collectTrainedTeachersCommonInfoState(filledRhf()),
    }
    expect(isTrainedTeachersRegistrationCanonicalSnapshot(typed)).toBe(true)
    const restored = rhfValuesFromTrainedTeachersCanonicalCommon(typed.common, typed.editor)
    expect(restored.title).toBe('RHF 제목')
    expect(restored.educationJournalEnabled).toBe(false)
    expect(restored.generalSurveyMenuKeys).toEqual([])

    const imported = importLegacyOverlayToTrainedTeachersCanonical({
      id: 'legacy',
      editor: typed.editor,
      overlay: {
        'trainedTeachersRegistration.basicInfo.programTitleKo': '레거시 제목',
        'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled': true,
      },
    })
    expect(imported.common.title).toBe('레거시 제목')
    expect(restored.title).not.toBe(imported.common.title)
  })

  it('공통정보 overlay 키를 신규 임시저장에서 뺀다', () => {
    const stripped = omitTrainedTeachersCommonInfoOverlayKeys({
      'trainedTeachersRegistration.basicInfo.programTitleKo': '제목',
      'recruit.detail': 'keep',
    })
    expect(stripped['trainedTeachersRegistration.basicInfo.programTitleKo']).toBeUndefined()
    expect(stripped['recruit.detail']).toBe('keep')
  })

  it('설문 overlay 쓰기는 generalSurveyMenuKeys 로만 반영한다', () => {
    const next = writeTrainedTeachersRhfOverlayValue(
      createDefaultTrainedTeachersRegistrationRhfValues(),
      'trainedTeachersRegistration.basicInfo.surveyItems',
      { survey: true, satisfaction: false, lecture_evaluation: false }
    )
    expect(next.generalSurveyMenuKeys).toEqual(['survey'])
    const projected = projectTrainedTeachersRhfToOverlayRecord(next)
    expect(projected['trainedTeachersRegistration.basicInfo.surveyItems']).toEqual({
      survey: true,
      satisfaction: false,
      lecture_evaluation: false,
    })
  })

  it('CREATE payload 에 surveyItems overlay 를 만들지 않는다', () => {
    const program = buildTrainedTeachersProgramFromRhf({
      id: 'tt-rhf',
      values: filledRhf(),
    })
    const request = mapTrainedTeacherToCreateRequest(program)
    const json = JSON.parse(String(request.serviceDetailJson)) as {
      registration?: unknown
      generalSurveyMenuKeys?: string[]
    }
    expect(json.registration).toBeUndefined()
    expect(JSON.stringify(json)).not.toContain('surveyItems')
    expect(json.generalSurveyMenuKeys).toEqual([])
  })

  it.each([
    { keys: ['survey', 'satisfaction', 'lecture_evaluation'], label: '3개' },
    { keys: ['survey', 'satisfaction'], label: '2개' },
    { keys: ['survey'], label: '1개' },
    { keys: [], label: '없음' },
  ] as const)('설문 $label 을 typed snapshot 으로 왕복한다', ({ keys }) => {
    const values = { ...filledRhf(), generalSurveyMenuKeys: [...keys] }
    const collected = collectTrainedTeachersCommonInfoState(values)
    const restored = rhfValuesFromTrainedTeachersCanonicalCommon(
      collected,
      {
        educationStructure: values.educationStructure,
        sessionRound: values.sessionRound,
        educationFormScheduleDetail: values.educationFormScheduleDetail,
        participationScheduleDetail: values.participationScheduleDetail,
        ipsScheduleDetail: values.ipsScheduleDetail,
        curriculumSessionCount: values.curriculumSessionCount,
        curriculumChartSessionCount: values.curriculumChartSessionCount,
        scheduleCurriculumDetailCount: values.scheduleCurriculumDetailCount,
        scheduleCurriculumGroupCount: values.scheduleCurriculumGroupCount,
        educationScheduleMode: values.educationScheduleMode,
        teacherTrainingEnabled: values.teacherTrainingEnabled,
        participant: values.participant,
      },
      values.sidecar
    )
    expect(restored.generalSurveyMenuKeys).toEqual([...keys])
    expect(
      buildTrainedTeachersProgramFromRhf({ id: 'tt-rhf', values }).generalSurveyMenuKeys
    ).toEqual([...keys])
  })

  it('sidecar 맵을 typed snapshot에 넣고 overlay store 없이 복원한다', () => {
    const values = {
      ...filledRhf(),
      sidecar: {
        'generalRegistration.educationCurriculum.unitNameBySession': { 1: 'RHF 단원' },
        'generalRegistration.educationCurriculum.unitContentBySession': { 1: '본문' },
      },
    }
    const collected = collectTrainedTeachersCommonInfoState(values)
    expect(collected.curriculumSessions.some(row => row.title === 'RHF 단원')).toBe(true)
    const restored = rhfValuesFromTrainedTeachersCanonicalCommon(
      collected,
      {
        educationStructure: values.educationStructure,
        sessionRound: values.sessionRound,
        educationFormScheduleDetail: values.educationFormScheduleDetail,
        participationScheduleDetail: values.participationScheduleDetail,
        ipsScheduleDetail: values.ipsScheduleDetail,
        curriculumSessionCount: values.curriculumSessionCount,
        curriculumChartSessionCount: values.curriculumChartSessionCount,
        scheduleCurriculumDetailCount: values.scheduleCurriculumDetailCount,
        scheduleCurriculumGroupCount: values.scheduleCurriculumGroupCount,
        educationScheduleMode: values.educationScheduleMode,
        teacherTrainingEnabled: values.teacherTrainingEnabled,
        participant: values.participant,
      },
      values.sidecar
    )
    expect(restored.sidecar['generalRegistration.educationCurriculum.unitNameBySession']).toEqual({
      1: 'RHF 단원',
    })
  })
})

describe('TT RHF 구조 8조합', () => {
  const combos = [
    { educationStructure: 'curriculum', sessionRound: 'single', teacherTrainingEnabled: false },
    { educationStructure: 'curriculum', sessionRound: 'single', teacherTrainingEnabled: true },
    { educationStructure: 'curriculum', sessionRound: 'multi', teacherTrainingEnabled: false },
    { educationStructure: 'curriculum', sessionRound: 'multi', teacherTrainingEnabled: true },
    { educationStructure: 'schedule', sessionRound: 'single', teacherTrainingEnabled: false },
    { educationStructure: 'schedule', sessionRound: 'single', teacherTrainingEnabled: true },
    { educationStructure: 'schedule', sessionRound: 'multi', teacherTrainingEnabled: false },
    { educationStructure: 'schedule', sessionRound: 'multi', teacherTrainingEnabled: true },
  ] as const

  it.each(combos)(
    '$educationStructure / $sessionRound / training=$teacherTrainingEnabled',
    combo => {
      const values = {
        ...filledRhf(),
        ...combo,
        educationJournalEnabled: combo.teacherTrainingEnabled,
        sidecar:
          combo.educationStructure === 'curriculum'
            ? {
                'generalRegistration.educationCurriculum.unitNameBySession': {
                  1: '1차시 단원',
                  2: '2차시 단원',
                },
                'generalRegistration.educationCurriculum.unitContentBySession': {
                  1: '본문1',
                  2: '본문2',
                },
              }
            : {
                'generalRegistration.educationScheduleCurriculum.eventNameByDetail': {
                  1: '일정1',
                  2: '일정2',
                },
              },
      }
      const collected = collectTrainedTeachersCommonInfoState(values)
      expect(collected.educationStructure).toBe(combo.educationStructure)
      expect(collected.sessionRound).toBe(combo.sessionRound)
      expect(collected.teacherTrainingEnabled).toBe(combo.teacherTrainingEnabled)
      expect(collected.educationJournalEnabled).toBe(combo.teacherTrainingEnabled)
      if (combo.educationStructure === 'curriculum') {
        expect(collected.scheduleDetails).toEqual([])
        expect(collected.curriculumSessions.length).toBeGreaterThan(0)
      } else {
        expect(collected.curriculumSessions).toEqual([])
      }
      const program = buildTrainedTeachersProgramFromRhf({ id: 'tt-rhf', values })
      expect(program.generalProgramEducationStructure).toBe(combo.educationStructure)
      expect(program.generalProgramSessionRound).toBe(combo.sessionRound)
      expect(program.generalCommonInfo?.educationJournalEnabled).toBe(combo.teacherTrainingEnabled)
    }
  )

  it('overlay 파생 스냅샷은 같은 값이면 참조가 유지된다', () => {
    const values = createDefaultTrainedTeachersRegistrationRhfValues()
    const surveyA = readTrainedTeachersRhfOverlayValue(
      values,
      'trainedTeachersRegistration.basicInfo.surveyItems'
    )
    const surveyB = readTrainedTeachersRhfOverlayValue(
      values,
      'trainedTeachersRegistration.basicInfo.surveyItems'
    )
    expect(surveyA).toBe(surveyB)
    const sponsorA = readTrainedTeachersRhfOverlayValue(
      values,
      'trainedTeachersRegistration.basicInfo.sponsorIds'
    )
    const sponsorB = readTrainedTeachersRhfOverlayValue(
      values,
      'trainedTeachersRegistration.basicInfo.sponsorIds'
    )
    expect(sponsorA).toBe(sponsorB)
    expect(sponsorA).toBe(values.sponsorManagementIds)
  })
})
