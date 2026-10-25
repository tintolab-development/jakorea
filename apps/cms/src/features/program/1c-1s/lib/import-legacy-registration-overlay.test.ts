import { describe, expect, it } from 'vitest'
import { importLegacyOverlayToCompanySchoolCanonical } from './import-legacy-registration-overlay'
import {
  projectCompanySchoolRhfToOverlayRecord,
  rhfValuesFromCompanySchoolCanonical,
} from './registration-rhf-values'

/** 실제 legacy localStorage(cms.jakorea.writingFormTemplateSaves.v1) overlay 모양을 본뜬 fixture */
const LEGACY_FIXTURE: Record<string, unknown> = {
  'economyRegistration.basicInfo.repKo': '대표',
  'economyRegistration.basicInfo.operationAnchorIso': '2026-11-03T00:00:00.000Z',
  'economyRegistration.kpi.participantCount': '30',
  'economyRegistration.kpi.volunteer': 4,
  'economyRegistration.kpi.educationProgress.done': 2,
  'economyRegistration.educationScheduleSettings.scheduleLines': ['11/3 1교시', 7, '11/4 2교시'],
  'economyRegistration.educationScheduleSettings.singleDateIso': '2026-11-03',
  'economyRecruit.detailInfo.additionalContentHtml': '<p>r</p>',
}

describe('P4/C10 1사1교 legacy overlay import', () => {
  it('sidecar 키(kpi.volunteer, kpi.educationProgress.*)를 보존한다', () => {
    const imported = importLegacyOverlayToCompanySchoolCanonical({ overlay: LEGACY_FIXTURE })
    expect(imported.sidecar).toEqual({
      'economyRegistration.kpi.volunteer': 4,
      'economyRegistration.kpi.educationProgress.done': 2,
      'economyRegistration.educationScheduleSettings.scheduleLines': ['11/3 1교시', 7, '11/4 2교시'],
      'economyRegistration.educationScheduleSettings.singleDateIso': '2026-11-03',
    })
  })

  it('educationScheduleLines·operationAnchorIso를 읽는다', () => {
    const { common } = importLegacyOverlayToCompanySchoolCanonical({ overlay: LEGACY_FIXTURE })
    expect(common.educationScheduleLines).toEqual(['11/3 1교시', '11/4 2교시'])
    expect(common.operationAnchorIso).toBe('2026-11-03T00:00:00.000Z')
    expect(common.participantCount).toBe(30)
  })

  it('import → RHF → overlay 투영 시 legacy 공통정보 키가 유실되지 않는다', () => {
    const imported = importLegacyOverlayToCompanySchoolCanonical({ overlay: LEGACY_FIXTURE })
    const values = rhfValuesFromCompanySchoolCanonical(
      imported.common,
      imported.sidecar,
      imported.recruit,
      imported.application
    )
    const projected = projectCompanySchoolRhfToOverlayRecord(values)
    expect(projected['economyRegistration.kpi.volunteer']).toBe(4)
    expect(projected['economyRegistration.kpi.educationProgress.done']).toBe(2)
    expect(projected['economyRegistration.basicInfo.operationAnchorIso']).toBe(
      '2026-11-03T00:00:00.000Z'
    )
  })

  it('빈 overlay → 빈 sidecar, 빈 일정', () => {
    const imported = importLegacyOverlayToCompanySchoolCanonical({})
    expect(imported.sidecar).toEqual({})
    expect(imported.common.educationScheduleLines).toEqual([])
    expect(imported.common.operationAnchorIso).toBeNull()
  })
})
