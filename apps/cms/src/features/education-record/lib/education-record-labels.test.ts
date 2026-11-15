import { describe, expect, it } from 'vitest'
import {
  formatEducationRecordEducationType,
  formatEducationRecordInstitutionType,
  formatEducationRecordIpOwned,
  formatEducationRecordPartnerInvolvement,
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

  it('keeps server-provided 기관 안/밖 labels as-is', () => {
    expect(formatEducationRecordInstitutionType('기관 안')).toBe('기관 안')
    expect(formatEducationRecordInstitutionType('기관 밖')).toBe('기관 밖')
    expect(formatEducationRecordInstitutionType(' 기관 안 ')).toBe('기관 안')
  })

  it('shows "-" for institution type values that are not 기관 안/밖/기타 labels', () => {
    expect(formatEducationRecordInstitutionType('SCHOOL')).toBe('-')
  })

  it('shows "-" when institution type is missing', () => {
    expect(formatEducationRecordInstitutionType(undefined)).toBe('-')
    expect(formatEducationRecordInstitutionType('')).toBe('-')
  })

  it('shows "-" for missing IP Owned instead of defaulting to JA', () => {
    expect(formatEducationRecordIpOwned(null)).toBe('-')
    expect(formatEducationRecordIpOwned(undefined)).toBe('-')
    expect(formatEducationRecordIpOwned('')).toBe('-')
    expect(formatEducationRecordIpOwned('Partner')).toBe('Partner')
  })

  it('maps partner involvement booleans and strings to Yes/No', () => {
    expect(formatEducationRecordPartnerInvolvement(true)).toBe('Yes')
    expect(formatEducationRecordPartnerInvolvement('true')).toBe('Yes')
    expect(formatEducationRecordPartnerInvolvement('TRUE')).toBe('Yes')
    expect(formatEducationRecordPartnerInvolvement('Yes')).toBe('Yes')
    expect(formatEducationRecordPartnerInvolvement('YES')).toBe('Yes')
    expect(formatEducationRecordPartnerInvolvement(false)).toBe('No')
    expect(formatEducationRecordPartnerInvolvement('false')).toBe('No')
    expect(formatEducationRecordPartnerInvolvement('FALSE')).toBe('No')
    expect(formatEducationRecordPartnerInvolvement('No')).toBe('No')
    expect(formatEducationRecordPartnerInvolvement('NO')).toBe('No')
  })

  it('shows "-" when partner involvement is missing instead of No', () => {
    expect(formatEducationRecordPartnerInvolvement(null)).toBe('-')
    expect(formatEducationRecordPartnerInvolvement(undefined)).toBe('-')
    expect(formatEducationRecordPartnerInvolvement('')).toBe('-')
    expect(formatEducationRecordPartnerInvolvement('   ')).toBe('-')
    expect(formatEducationRecordPartnerInvolvement('Maybe')).toBe('Maybe')
  })

  it('maps education type hybrid aliases', () => {
    expect(formatEducationRecordEducationType('hybrid')).toBe('온/오프라인')
    expect(formatEducationRecordEducationType('HYBRID')).toBe('온/오프라인')
    expect(formatEducationRecordEducationType('ONLINE')).toBe('온라인')
    expect(formatEducationRecordEducationType('혼합')).toBe('온/오프라인')
  })

  it('normalizes business area spaces', () => {
    expect(normalizeEducationRecordBusinessArea('디지털 리터러시')).toBe('디지털리터러시')
  })
})
