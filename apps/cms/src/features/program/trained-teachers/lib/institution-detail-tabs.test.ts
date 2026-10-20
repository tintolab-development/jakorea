import { describe, expect, it } from 'vitest'
import {
  getTrainedTeachersInstitutionDetailTabKeys,
  isTrainedTeachersInstitutionDetailTabKey,
  normalizeTrainedTeachersInstitutionDetailTab,
} from './institution-detail-tabs'

describe('trained teacher institution detail tabs', () => {
  it('keeps the remote attendance tab addressable even when journals are disabled', () => {
    expect(getTrainedTeachersInstitutionDetailTabKeys(false)).toEqual([
      'application',
      'students',
      'attendance',
    ])
    expect(normalizeTrainedTeachersInstitutionDetailTab('attendance', false)).toBe('attendance')
  })

  it('shows the student roster tab unless navigation explicitly disables it', () => {
    expect(getTrainedTeachersInstitutionDetailTabKeys(true, true)).toContain('students')
    expect(getTrainedTeachersInstitutionDetailTabKeys(true, undefined)).toContain('students')
    expect(getTrainedTeachersInstitutionDetailTabKeys(true, false)).toEqual([
      'application',
      'attendance',
      'journal',
    ])
  })

  it('accepts the students deep link', () => {
    expect(isTrainedTeachersInstitutionDetailTabKey('students')).toBe(true)
    expect(normalizeTrainedTeachersInstitutionDetailTab('students')).toBe('students')
  })
})
