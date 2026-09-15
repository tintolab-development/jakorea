import { describe, expect, it } from 'vitest'
import {
  countActiveEducationCompletions,
  mapEducationCompletionResponseToView,
} from './education-completions-adapters'

describe('education-completions adapters', () => {
  it('maps active completion as SSOT student education row', () => {
    const view = mapEducationCompletionResponseToView({
      completionId: 1,
      programId: 186008,
      organizationApplicationId: 10,
      studentCountSnapshot: 25,
      classCountSnapshot: 2,
      completionStatus: 'COMPLETED',
      completedAt: '2026-09-01T00:00:00Z',
    })
    expect(view.isActiveCompletion).toBe(true)
    expect(view.studentCount).toBe(25)
    expect(view.programId).toBe('186008')
  })

  it('treats cancelled completions as inactive', () => {
    const view = mapEducationCompletionResponseToView({
      completionId: 2,
      cancelledAt: '2026-09-02T00:00:00Z',
      completionStatus: 'CANCELLED',
    })
    expect(view.isActiveCompletion).toBe(false)
    expect(countActiveEducationCompletions([view])).toBe(0)
  })
})
