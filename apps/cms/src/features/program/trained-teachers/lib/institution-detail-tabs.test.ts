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

  it('hides student roster and attendance when student list is not required', () => {
    expect(getTrainedTeachersInstitutionDetailTabKeys(true, true, false)).toEqual([
      'application',
      'journal',
    ])
    expect(normalizeTrainedTeachersInstitutionDetailTab('students', true, false)).toBe(
      'application'
    )
    expect(normalizeTrainedTeachersInstitutionDetailTab('attendance', true, false)).toBe(
      'application'
    )
  })

  it('keeps student roster and attendance when student list is required', () => {
    expect(getTrainedTeachersInstitutionDetailTabKeys(true, true, true)).toEqual([
      'application',
      'students',
      'attendance',
      'journal',
    ])
  })

  it('accepts the students deep link', () => {
    expect(isTrainedTeachersInstitutionDetailTabKey('students')).toBe(true)
    expect(normalizeTrainedTeachersInstitutionDetailTab('students')).toBe('students')
  })
})
