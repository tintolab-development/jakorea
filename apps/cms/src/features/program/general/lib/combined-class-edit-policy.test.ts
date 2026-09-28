import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import {
  isCombinedClassProgramEligible,
  resolveCombinedClassApplyRadioDisabled,
} from '@/features/program/general/lib/combined-class-edit-policy'

describe('combined-class-edit-policy', () => {
  it('GENERAL_ORGANIZATION 단일 회차에서만 합반 신청 가능', () => {
    expect(
      isCombinedClassProgramEligible({
        backendProgramType: 'GENERAL_ORGANIZATION',
        generalProgramSessionRound: 'single',
      } as Program)
    ).toBe(true)
    expect(
      isCombinedClassProgramEligible({
        backendProgramType: 'GENERAL_ORGANIZATION',
        generalProgramSessionRound: 'multi',
      } as Program)
    ).toBe(false)
    expect(
      isCombinedClassProgramEligible({
        backendProgramType: 'TRAINED_TEACHER',
        generalProgramSessionRound: 'single',
      } as Program)
    ).toBe(false)
    expect(
      isCombinedClassProgramEligible({
        backendProgramType: 'GENERAL',
        generalProgramSessionRound: 'single',
      } as Program)
    ).toBe(false)
    expect(isCombinedClassProgramEligible({} as Program)).toBe(false)
  })

  it('동일 기관 타 학년이 없으면 신청 라디오를 비활성화한다', () => {
    expect(resolveCombinedClassApplyRadioDisabled([])).toBe(true)
    expect(resolveCombinedClassApplyRadioDisabled([{ value: 'a' }])).toBe(false)
  })
})
