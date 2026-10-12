import { describe, expect, it } from 'vitest'
import { resolveInterviewEvaluationSlotEditable } from './interview-evaluation-section'

const empty = {
  managerAScore: null,
  managerBScore: null,
  managerAEvaluatorAdminId: null,
  managerBEvaluatorAdminId: null,
}

describe('resolveInterviewEvaluationSlotEditable', () => {
  it('opens both slots for master or program PM even when other admins filled them', () => {
    expect(
      resolveInterviewEvaluationSlotEditable(
        { managerAScore: 5, managerBScore: 4, managerAEvaluatorAdminId: 1, managerBEvaluatorAdminId: 2 },
        true,
        99
      )
    ).toEqual({ a: true, b: true })
  })

  it('opens only empty slots for an admin who has not evaluated yet', () => {
    expect(resolveInterviewEvaluationSlotEditable(empty, false, 7)).toEqual({ a: true, b: true })
    expect(
      resolveInterviewEvaluationSlotEditable(
        { ...empty, managerAScore: 3, managerAEvaluatorAdminId: 1 },
        false,
        7
      )
    ).toEqual({ a: false, b: true })
  })

  it('keeps an admin on their own slot and locks the other one', () => {
    expect(
      resolveInterviewEvaluationSlotEditable(
        { ...empty, managerBScore: 2, managerBEvaluatorAdminId: 7 },
        false,
        7
      )
    ).toEqual({ a: false, b: true })
  })
})
