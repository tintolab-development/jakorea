import { describe, expect, it } from 'vitest'
import {
  getProgramProgressUiBucket,
  getProgramProgressUiLabel,
  getTypedProgramLifecycleDisplay,
  getTypedProgramLifecycleLabel,
  normalizeTypedProgramLifecycleStatus,
} from '@/shared/lib/program-typed-lifecycle'

describe('program-typed-lifecycle', () => {
  it('keeps typed Admin API vocabulary', () => {
    expect(normalizeTypedProgramLifecycleStatus('scheduled')).toBe('scheduled')
    expect(normalizeTypedProgramLifecycleStatus('recruiting_students')).toBe('recruiting_students')
    expect(normalizeTypedProgramLifecycleStatus('in_progress')).toBe('in_progress')
    expect(normalizeTypedProgramLifecycleStatus('completed')).toBe('completed')
  })

  it('redirects legacy and periodStatus uppercase to typed', () => {
    expect(normalizeTypedProgramLifecycleStatus('SCHEDULED')).toBe('scheduled')
    expect(normalizeTypedProgramLifecycleStatus('RECRUITING')).toBe('recruiting_students')
    expect(normalizeTypedProgramLifecycleStatus('IN_PROGRESS')).toBe('in_progress')
    expect(normalizeTypedProgramLifecycleStatus('education_in_progress')).toBe('in_progress')
    expect(normalizeTypedProgramLifecycleStatus('education_completed')).toBe('completed')
    expect(normalizeTypedProgramLifecycleStatus('planned')).toBe('scheduled')
  })

  it('maps progress UI to 3 buckets — recruiting_students with scheduled', () => {
    expect(getProgramProgressUiBucket('scheduled')).toBe('SCHEDULED')
    expect(getProgramProgressUiBucket('recruiting_students')).toBe('SCHEDULED')
    expect(getProgramProgressUiBucket('in_progress')).toBe('IN_PROGRESS')
    expect(getProgramProgressUiBucket('completed')).toBe('COMPLETED')
    expect(getProgramProgressUiBucket(null)).toBe('SCHEDULED')
    expect(getProgramProgressUiBucket('???')).toBe('SCHEDULED')
  })

  it('uses shared 3-state labels for list and detail widget', () => {
    expect(getTypedProgramLifecycleLabel('scheduled')).toBe('프로그램 진행 예정')
    expect(getTypedProgramLifecycleLabel('recruiting_students')).toBe('프로그램 진행 예정')
    expect(getTypedProgramLifecycleLabel('in_progress')).toBe('프로그램 진행 중')
    expect(getTypedProgramLifecycleLabel('completed')).toBe('프로그램 진행 완료')
    expect(getTypedProgramLifecycleLabel('education_in_progress')).toBe('프로그램 진행 중')
    expect(getProgramProgressUiLabel(null)).toBe('프로그램 진행 예정')
    expect(getTypedProgramLifecycleDisplay('recruiting_students').label).toBe('프로그램 진행 예정')
    expect(getTypedProgramLifecycleDisplay('recruiting_students').color).toBe(
      getTypedProgramLifecycleDisplay('scheduled').color
    )
  })
})
