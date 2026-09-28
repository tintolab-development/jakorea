import { describe, expect, it } from 'vitest'
import { resolveFormBindingTargetType } from './resolve-form-binding-target-type'

describe('resolveFormBindingTargetType', () => {
  it('passes ORGANIZATION/INDIVIDUAL through unchanged', () => {
    expect(resolveFormBindingTargetType('ORGANIZATION')).toBe('ORGANIZATION')
    expect(resolveFormBindingTargetType('INDIVIDUAL')).toBe('INDIVIDUAL')
  })

  it('maps INSTRUCTOR → TEACHER (BE canonical recruitment targetType)', () => {
    expect(resolveFormBindingTargetType('INSTRUCTOR')).toBe('TEACHER')
  })

  it('maps VOLUNTEER → COLLEGE_STUDENT (BE canonical recruitment targetType)', () => {
    expect(resolveFormBindingTargetType('VOLUNTEER')).toBe('COLLEGE_STUDENT')
  })
})
