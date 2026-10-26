// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  applyOperationalOverlayForCatalogId,
  collectOperationalOverlayForCatalogId,
  resetOperationalOverlayForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  resetAllOperationalOverlayStores,
  setOperationalOverlayScope,
} from '@/features/template/ui/form-set/shared/set-operational-overlay-scope'
import {
  getGeneralApplicationOverlayRecord,
  patchGeneralApplicationOverlay,
  peekGeneralApplicationOverlayRecord,
  updateGeneralApplicationOverlayKey,
  useGeneralApplicationOverlayKv,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import {
  getProgramRegistrationOverlayRecord,
  patchProgramRegistrationOverlay,
  replaceProgramRegistrationOverlay,
  updateProgramRegistrationOverlayKey,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { collectTrainedTeachersApplicationFormState } from '@/features/program/trained-teachers/lib/application-form-state'
import { importLegacyOverlayToTrainedTeachersCanonical } from '@/features/program/trained-teachers/lib/import-legacy-registration-overlay'

/**
 * Part3 3단계(TT) 저장 결과 고정 — 27a66e078(스토어)에서 스냅샷 생성, 전환 뒤에도 같아야 한다.
 * TT RHF 미마운트(양식 편집기·fallback) 경로. 마운트 경로는 기존 TT ssot 테스트가 고정한다.
 */
const APP = 'application-trained-teachers'
const REG = 'registration-trained-teachers'

function sorted(record: Record<string, unknown> | null | undefined) {
  if (record == null) return record
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)))
}

const APP_OVERLAY = {
  'application.trainedTeachers.basicInfo.applicationGrade': '3',
  'application.trainedTeachers.basicInfo.classCount': '2',
  'application.trainedTeachers.basicInfo.teacherEmail': 't@a.b',
  'application.trainedTeachers.preferredSchedules': [{ id: 'b1', date: '2026-12-01' }],
  'application.institution.basicInfo.x': 'other',
}

const REG_OVERLAY = {
  'trainedTeachersRegistration.basicInfo.programTitleKo': '연수',
  'trainedTeachersRegistration.basicInfo.operationRangeSeal': { start: '2026-12-01', end: '2026-12-31' },
  'trainedTeachersRegistration.typeSettings.educationForm': 'offline',
  'trainedTeachersRegistration.typeSettings.ipsType': { category: 'prepare', detail: 'none' },
  'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled': 'yes',
  'trainedTeachersRegistration.educationScheduleSettings.scheduleLines': ['2026-12-02'],
  'generalRegistration.basicInfo.localProgramTitleKo': '일반키',
}

describe('TT overlay save parity (part3 step3)', () => {
  beforeEach(() => {
    resetAllOperationalOverlayStores()
  })

  it('신청 양식: 불러오기 → collect·peek·fallback state', () => {
    applyOperationalOverlayForCatalogId(APP, APP_OVERLAY)
    expect(sorted(collectOperationalOverlayForCatalogId(APP))).toMatchSnapshot('app-apply')
    expect(sorted(peekGeneralApplicationOverlayRecord(APP))).toMatchSnapshot('app-peek')
    expect(collectTrainedTeachersApplicationFormState()).toMatchSnapshot('app-fallback-state')
  })

  it('신청 양식: 입력(patch·updateKey·훅) → collect·활성 레코드·reset', () => {
    setOperationalOverlayScope(APP)
    patchGeneralApplicationOverlay({ 'application.trainedTeachers.basicInfo.teacherTel': '02' })
    updateGeneralApplicationOverlayKey<unknown[]>(
      'application.trainedTeachers.preferredSchedules',
      prev => [...(prev ?? []), { id: 'n1' }]
    )
    const { result } = renderHook(() =>
      useGeneralApplicationOverlayKv<string>('application.trainedTeachers.basicInfo.classCount', '')
    )
    act(() => result.current[1]('4'))
    expect(result.current[0]).toBe('4')
    expect(sorted(collectOperationalOverlayForCatalogId(APP))).toMatchSnapshot('app-input')
    expect(sorted(getGeneralApplicationOverlayRecord())).toMatchSnapshot('app-active')
    resetOperationalOverlayForCatalogId(APP)
    expect(sorted(collectOperationalOverlayForCatalogId(APP))).toMatchSnapshot('app-reset')
  })

  it('등록(공통정보) 양식: 불러오기·입력 → 레코드·collect·legacy import', () => {
    applyOperationalOverlayForCatalogId(REG, REG_OVERLAY)
    expect(sorted(collectOperationalOverlayForCatalogId(REG))).toMatchSnapshot('reg-apply')
    setOperationalOverlayScope(REG)
    replaceProgramRegistrationOverlay(REG_OVERLAY)
    patchProgramRegistrationOverlay({
      'trainedTeachersRegistration.educationScheduleSettings.singleDateIso': '2026-12-03',
    })
    updateProgramRegistrationOverlayKey<string[]>(
      'trainedTeachersRegistration.educationScheduleSettings.scheduleLines',
      prev => [...(prev ?? []), '2026-12-04']
    )
    const { result } = renderHook(() =>
      useProgramRegistrationOverlayKv<'yes' | 'no'>(
        'trainedTeachersRegistration.educationCurriculum.educationJournalEnabled',
        'no'
      )
    )
    expect(result.current[0]).toBe('yes')
    act(() => result.current[1]('no'))
    expect(sorted(getProgramRegistrationOverlayRecord())).toMatchSnapshot('reg-active')
    expect(sorted(collectOperationalOverlayForCatalogId(REG))).toMatchSnapshot('reg-collect')
    expect(
      importLegacyOverlayToTrainedTeachersCanonical({
        id: 'p',
        editor: {
          educationStructure: 'schedule',
          sessionRound: 'single',
          educationFormScheduleDetail: 'common',
          participationScheduleDetail: 'common',
          ipsScheduleDetail: 'common',
          curriculumSessionCount: 1,
          curriculumChartSessionCount: 1,
          scheduleCurriculumDetailCount: 1,
          scheduleCurriculumGroupCount: 1,
          educationScheduleMode: 'date',
          teacherTrainingEnabled: false,
          participant: { individual: false, organization: true, teacherInstructor: false, volunteer: false },
        },
        overlay: getProgramRegistrationOverlayRecord(),
      }).common
    ).toMatchSnapshot('reg-legacy-import')
  })
})
