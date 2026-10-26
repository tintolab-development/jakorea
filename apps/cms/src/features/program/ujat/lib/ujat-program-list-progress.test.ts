import { describe, expect, it } from 'vitest'
import {
  resolveUjatProgramListProgressStatus,
  UJAT_PROGRAM_LIST_PROGRESS_ORDER,
} from './ujat-program-list-progress'

describe('UJAT program list progress', () => {
  it('uses the canonical status for all five filter values', () => {
    for (const status of UJAT_PROGRAM_LIST_PROGRESS_ORDER) {
      expect(resolveUjatProgramListProgressStatus({ ujatProgressStatus: status })).toBe(status)
    }
  })

  it('does not infer a status when the canonical field is absent', () => {
    expect(resolveUjatProgramListProgressStatus({ id: '182103' })).toBeNull()
  })
})
