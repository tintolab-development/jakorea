import { describe, expect, it } from 'vitest'
import type { Program } from '@/types/domain'
import { isTrainedTeachersDetailProgram } from './is-trained-teachers-detail-program'

describe('isTrainedTeachersDetailProgram', () => {
  it('recognizes remote TT programs by the backend program type', () => {
    expect(
      isTrainedTeachersDetailProgram({
        id: '186264',
        backendProgramType: 'TRAINED_TEACHER',
      } as Program)
    ).toBe(true)
  })
})
