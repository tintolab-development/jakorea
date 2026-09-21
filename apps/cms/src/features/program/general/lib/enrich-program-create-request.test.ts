import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Program } from '@/types/domain'
import { enrichProgramCreateRequestWithRegistrationFormBindings } from './enrich-program-create-request'

vi.mock('./registration-create-form-bindings-capabilities', () => ({
  shouldUseRegistrationCreateFormBindings: vi.fn(() => true),
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
})
