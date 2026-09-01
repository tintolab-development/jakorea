import { describe, expect, it } from 'vitest'
import { countGeneralProgramOverviewStages } from '@/features/program/general/lib/overview-stage-counts'
import type { Program } from '@/types/domain'

function stub(lifecycleStatus: Program['lifecycleStatus']): Program {
  return {
    id: lifecycleStatus ?? 'x',
    title: lifecycleStatus ?? 'x',
    sponsorId: 's',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [],
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'pending',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    lifecycleStatus,
  }
}

describe('countGeneralProgramOverviewStages', () => {
  it('lists overview buckets with the same rules as list status filter', () => {
    const programs = [
      stub('recruiting_students'),
      stub('matching_completed'),
      stub('education_in_progress'),
      stub('education_completed'),
      stub('planned'),
    ]
    expect(countGeneralProgramOverviewStages(programs)).toEqual({
      total: 5,
      scheduled: 2,
      inProgress: 1,
      completed: 1,
    })
  })
})
