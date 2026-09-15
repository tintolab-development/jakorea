import { describe, expect, it } from 'vitest'
import {
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

  it('uses shared labels for list and detail widget', () => {
    expect(getTypedProgramLifecycleLabel('scheduled')).toBe('진행 예정')
    expect(getTypedProgramLifecycleLabel('recruiting_students')).toBe('모집 중')
    expect(getTypedProgramLifecycleLabel('in_progress')).toBe('진행 중')
    expect(getTypedProgramLifecycleLabel('completed')).toBe('완료')
    expect(getTypedProgramLifecycleLabel('education_in_progress')).toBe('진행 중')
  })
})
