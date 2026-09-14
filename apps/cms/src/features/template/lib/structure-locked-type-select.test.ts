import { describe, expect, it } from 'vitest'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'
import { resolveStructureLockedDisplayKind } from '@/features/template/lib/structure-locked-type-select'

describe('resolveStructureLockedDisplayKind', () => {
  it('강사 신청 시드 — 개인정보·제3자·성범죄는 테이블', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent,
        'single_item'
      )
    ).toBe('table')
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord,
        'single_item'
      )
    ).toBe('table')
  })

  it('강사 신청 시드 — 강의 진행 가능 일정은 단일항목', () => {
    expect(
      resolveStructureLockedDisplayKind(
        PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule,
        'table'
      )
    ).toBe('single_item')
  })

  it('맵에 없으면 fallback', () => {
    expect(resolveStructureLockedDisplayKind('unknown-paragraph', 'table')).toBe('table')
  })
})
