import { describe, expect, it } from 'vitest'
import {
  formatEducationRecordEducationType,
  formatEducationRecordInstitutionType,
  formatEducationRecordTargetLevel,
  normalizeEducationRecordBusinessArea,
} from './education-record-labels'

describe('education-record-labels', () => {
  it('maps target level enum and short labels to planning copy', () => {
    expect(formatEducationRecordTargetLevel('elementary')).toBe('초등학생')
    expect(formatEducationRecordTargetLevel('초')).toBe('초등학생')
    expect(formatEducationRecordTargetLevel('고등학생')).toBe('고등학생')
    expect(formatEducationRecordTargetLevel('university')).toBe('대학생')
    expect(formatEducationRecordTargetLevel()).toBe('-')
  })

  it('maps institution type to 기관 안/밖/기타', () => {
    expect(formatEducationRecordInstitutionType('inside_school')).toBe('기관 안')
    expect(formatEducationRecordInstitutionType('학교 밖')).toBe('기관 밖')
    expect(formatEducationRecordInstitutionType('기타')).toBe('기타')
    expect(formatEducationRecordInstitutionType('other')).toBe('기타')
  })

  it('maps education type hybrid aliases', () => {
    expect(formatEducationRecordEducationType('hybrid')).toBe('온/오프라인')
    expect(formatEducationRecordEducationType('혼합')).toBe('온/오프라인')
  })

  it('normalizes business area spaces', () => {
    expect(normalizeEducationRecordBusinessArea('디지털 리터러시')).toBe('디지털리터러시')
  })
})
