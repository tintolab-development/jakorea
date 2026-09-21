import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { enrichProgramCreateRequestWithRegistrationFormBindings } from './enrich-program-create-request'

vi.mock('./registration-create-form-bindings-capabilities', () => ({
  shouldUseRegistrationCreateFormBindings: vi.fn(() => true),
  shouldAttachInlineFormBindingsOnProgramCreate: vi.fn(() => true),
}))

vi.mock('./build-registration-create-form-bindings', () => ({
  buildRegistrationCreateFormBindings: vi.fn(async () => ({
    programDraftId: 42,
    formBindings: [
      {
        formType: 'APPLICATION',
        templateId: 10,
        templateVersionId: 99,
        targetRole: 'ORGANIZATION',
        active: true,
      },
    ],
  })),
}))

describe('enrichProgramCreateRequestWithRegistrationFormBindings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('merges programDraftId, formBindings and disables autoApplyDefaultFormBindings', async () => {
    const program = { id: '186010' } as Program
    const base = {
      title: 'test',
      autoApplyDefaultFormBindings: true,
    }

    const result = await enrichProgramCreateRequestWithRegistrationFormBindings(program, base)

    expect(result.autoApplyDefaultFormBindings).toBe(false)
    expect(result.programDraftId).toBe(42)
    expect(result.formBindings).toHaveLength(1)
    expect(result.title).toBe('test')
  })

  it('uses prepared payload without calling buildRegistrationCreateFormBindings', async () => {
    const { buildRegistrationCreateFormBindings } = await import(
      './build-registration-create-form-bindings'
    )
    const program = { id: '186010' } as Program
    const prepared = {
      programDraftId: 7,
      formBindings: [
        {
          formType: 'REGISTRATION' as const,
          templateId: 1,
          templateVersionId: 2,
          active: true,
        },
      ],
    }

    const result = await enrichProgramCreateRequestWithRegistrationFormBindings(
      program,
      { title: 'prepared' },
      prepared
    )

    expect(buildRegistrationCreateFormBindings).not.toHaveBeenCalled()
    expect(result.programDraftId).toBe(7)
    expect(result.formBindings).toHaveLength(1)
  })

  it('merges inline formBindings for TRAINED_TEACHER', async () => {
    const program = { id: 'trained-teachers-local-test' } as Program
    const base = {
      title: 'tt',
      autoApplyDefaultFormBindings: true,
      programType: 'TRAINED_TEACHER' as const,
    }
    const prepared = {
      programDraftId: 42,
      formBindings: [
        {
          formType: 'REGISTRATION' as const,
          templateId: 1,
          templateVersionId: 2,
          active: true,
        },
      ],
    }

    const result = await enrichProgramCreateRequestWithRegistrationFormBindings(
      program,
      base,
      prepared
    )

    expect(result.autoApplyDefaultFormBindings).toBe(false)
    expect(result.programDraftId).toBe(42)
    expect(result.formBindings).toEqual(prepared.formBindings)
    expect(result.programType).toBe('TRAINED_TEACHER')
  })

  it('skips enrich when inline formBindings are not allowed (Gemini / Volunteer)', async () => {
    const { shouldAttachInlineFormBindingsOnProgramCreate } = await import(
      './registration-create-form-bindings-capabilities'
    )
    const { buildRegistrationCreateFormBindings } = await import(
      './build-registration-create-form-bindings'
    )
    vi.mocked(shouldAttachInlineFormBindingsOnProgramCreate).mockReturnValueOnce(false)

    const program = { id: 'gemini-local-test' } as Program
    const base = {
      title: 'gemini',
      autoApplyDefaultFormBindings: true,
    }

    const result = await enrichProgramCreateRequestWithRegistrationFormBindings(program, base, {
      programDraftId: 42,
      formBindings: [
        {
          formType: 'REGISTRATION',
          templateId: 1,
          templateVersionId: 2,
          active: true,
        },
      ],
    })

    expect(result).toEqual(base)
    expect(result.formBindings).toBeUndefined()
    expect(result.programDraftId).toBeUndefined()
    expect(result.autoApplyDefaultFormBindings).toBe(true)
    expect(buildRegistrationCreateFormBindings).not.toHaveBeenCalled()
  })
})
