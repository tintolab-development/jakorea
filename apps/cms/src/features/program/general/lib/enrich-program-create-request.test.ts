import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { enrichProgramCreateRequestWithRegistrationFormBindings } from './enrich-program-create-request'

vi.mock('./registration-create-form-bindings-capabilities', () => ({
  shouldUseRegistrationCreateFormBindings: vi.fn(() => true),
  shouldApplyRegistrationFormsAfterCreate: vi.fn(() => true),
}))

describe('enrichProgramCreateRequestWithRegistrationFormBindings (programDraftId 없는 CREATE)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('programDraftId·formBindings 없이 autoApplyDefaultFormBindings=true로 보낸다', () => {
    const program = { id: '186010' } as Program
    const result = enrichProgramCreateRequestWithRegistrationFormBindings(program, {
      title: 'test',
      autoApplyDefaultFormBindings: false,
    })
    expect(result.autoApplyDefaultFormBindings).toBe(true)
    expect(result).not.toHaveProperty('programDraftId')
    expect(result).not.toHaveProperty('formBindings')
    expect(result.title).toBe('test')
  })

  it('기존 요청에 programDraftId·formBindings가 있어도 제거한다', () => {
    const program = { id: 'trained-teachers-local-test' } as Program
    const result = enrichProgramCreateRequestWithRegistrationFormBindings(program, {
      title: 'tt',
      programType: 'TRAINED_TEACHER',
      programDraftId: 42,
      formBindings: [
        { formType: 'REGISTRATION', templateId: 1, templateVersionId: 2, active: true },
      ],
    })
    expect(result).not.toHaveProperty('programDraftId')
    expect(result).not.toHaveProperty('formBindings')
    expect(result.autoApplyDefaultFormBindings).toBe(true)
    expect(result.programType).toBe('TRAINED_TEACHER')
  })

  it('대상이 아닌 유형(Gemini / Volunteer)은 요청을 그대로 둔다', async () => {
    const { shouldApplyRegistrationFormsAfterCreate } = await import(
      './registration-create-form-bindings-capabilities'
    )
    vi.mocked(shouldApplyRegistrationFormsAfterCreate).mockReturnValueOnce(false)
    const base = { title: 'gemini', autoApplyDefaultFormBindings: true }
    const result = enrichProgramCreateRequestWithRegistrationFormBindings(
      { id: 'gemini-local-test' } as Program,
      base
    )
    expect(result).toEqual(base)
  })
})
