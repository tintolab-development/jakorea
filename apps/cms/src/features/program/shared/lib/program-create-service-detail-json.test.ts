import { describe, expect, it } from 'vitest'
import {
  assertServiceDetailJsonForCreate,
  stripRegistrationOverlayDebugKeys,
} from './program-create-service-detail-json'

describe('program-create-service-detail-json', () => {
  it('assertServiceDetailJsonForCreate rejects truncated JSON', () => {
    expect(() => assertServiceDetailJsonForCreate('{"version":1,"program":{')).toThrow(
      /valid JSON object/
    )
  })

  it('assertServiceDetailJsonForCreate accepts versioned envelope', () => {
    expect(() =>
      assertServiceDetailJsonForCreate(JSON.stringify({ version: 1, program: {} }))
    ).not.toThrow()
  })

  it('stripRegistrationOverlayDebugKeys removes create-only meta', () => {
    const next = stripRegistrationOverlayDebugKeys({
      'ujat.basicInfo.repKo': 'test',
      idempotencyKey: 'uuid',
      preparedFormBindings: { programDraftId: 1 },
    })
    expect(next).toEqual({ 'ujat.basicInfo.repKo': 'test' })
  })
})
