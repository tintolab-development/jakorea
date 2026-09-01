import { describe, expect, it } from 'vitest'
import { mapTrainedTeacherPerformanceSummary } from './performance-summary-adapters'

describe('trained-teacher performance-summary adapters', () => {
  it('maps dto counts and flags', () => {
    const view = mapTrainedTeacherPerformanceSummary({
      programId: 11,
      teacherTrainingEnabled: true,
      educationJournalEnabled: true,
      organizationApplicationCount: 5,
      teacherTrainingParticipantCount: 12,
      trainedTeacherCount: 8,
      studentCount: 100,
      classCount: 4,
      journalSubmittedCount: 3,
      journalNotSubmittedCount: 2,
      availableActions: ['VIEW_JOURNAL'],
    })
    expect(view.programId).toBe('11')
    expect(view.teacherTrainingEnabled).toBe(true)
    expect(view.organizationApplicationCount).toBe(5)
    expect(view.journalSubmittedCount).toBe(3)
    expect(view.availableActions).toEqual(['VIEW_JOURNAL'])
  })

  it('defaults missing counts to 0', () => {
    const view = mapTrainedTeacherPerformanceSummary({ programId: 1 })
    expect(view.studentCount).toBe(0)
    expect(view.availableActions).toEqual([])
  })
})
