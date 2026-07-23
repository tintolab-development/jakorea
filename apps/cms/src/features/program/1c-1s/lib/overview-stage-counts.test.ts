import { describe, expect, it } from 'vitest'
import { countCompanySchoolOverviewStages } from '@/features/program/1c-1s/lib/overview-stage-counts'
import type { Program } from '@/types/domain'

function stub(
  lifecycleStatus: Program['lifecycleStatus'],
  dates?: { startDate: string; endDate: string }
): Program {
  return {
    id: lifecycleStatus ?? 'x',
    title: lifecycleStatus ?? 'x',
    sponsorId: 's',
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: '',
    rounds: [],
    startDate: dates?.startDate ?? 'invalid',
    endDate: dates?.endDate ?? 'invalid',
    status: 'pending',
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    lifecycleStatus,
  }
}

describe('countCompanySchoolOverviewStages', () => {
  it('falls back to lifecycle when operation dates are invalid', () => {
    const programs = [
      stub('recruiting_students'),
      stub('matching_completed'),
      stub('education_after_textbook'),
      stub('education_completed'),
      stub('planned'),
    ]
    expect(countCompanySchoolOverviewStages(programs)).toEqual({
      total: 5,
      scheduled: 2,
      inProgress: 1,
      completed: 1,
    })
  })

  it('prefers operation date phase over lifecycle when dates are valid', () => {
    const programs = [
      stub('education_completed', {
        startDate: '2099-01-01',
        endDate: '2099-12-31',
      }),
    ]
    expect(countCompanySchoolOverviewStages(programs)).toEqual({
      total: 1,
      scheduled: 1,
      inProgress: 0,
      completed: 0,
    })
  })
})
