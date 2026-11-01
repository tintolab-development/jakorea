import { describe, expect, it } from 'vitest'
import {
  buildGeminiInstructorIdentityKey,
  buildGeminiPerformanceServerMatchKey,
  normalizeGeminiTrainingClock,
} from './server-match-key'

describe('gemini performance server match key (BE SSOT)', () => {
  it('normalizes clock to HH:mm', () => {
    expect(normalizeGeminiTrainingClock('9:20:00')).toBe('09:20')
    expect(normalizeGeminiTrainingClock('10:00:00')).toBe('10:00')
  })

  it('builds instructorIdentity M / BLANK / U', () => {
    expect(buildGeminiInstructorIdentityKey({ instructorMemberId: 42 })).toBe('M:42')
    expect(buildGeminiInstructorIdentityKey({ instructorName: '', instructorPhone: '' })).toBe(
      'BLANK'
    )
    expect(
      buildGeminiInstructorIdentityKey({
        instructorName: '김강사',
        instructorPhone: '010-1234-5678',
      })
    ).toBe('U:김강사|01012345678')
  })

  it('matches BLANK session key with programId + date + start + location', () => {
    const key = buildGeminiPerformanceServerMatchKey({
      programId: 186425,
      trainingDate: '2026-08-15',
      trainingStartTime: '10:00:00',
      trainingLocation: '중복키테스트학교',
      instructorName: '',
      instructorPhone: '',
    })
    expect(key).toBe('186425|BLANK|2026-08-15|10:00|중복키테스트학교')
  })

  it('falls back location to schoolOrOrganizationName', () => {
    const key = buildGeminiPerformanceServerMatchKey({
      programId: 186425,
      trainingDate: '2026-08-15',
      trainingStartTime: '10:00',
      schoolOrOrganizationName: '중복키테스트학교',
      instructorName: null,
    })
    expect(key).toBe('186425|BLANK|2026-08-15|10:00|중복키테스트학교')
  })
})
