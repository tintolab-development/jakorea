import { describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import {
  computeGeneralInterviewTotalScore,
  isGeneralInterviewTotalScoreUnevaluated,
  parseGeneralInterviewSlotEndFromRow,
  resolveGeneralEffectiveSecondInterviewStatus,
} from './general-volunteer-interview2-display'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'

describe('general interview total score (BE unevaluated parity)', () => {
  it('treats no submissions as unevaluated', () => {
    const row = { managerAScore: null, managerBScore: null }
    expect(isGeneralInterviewTotalScoreUnevaluated(row)).toBe(true)
    expect(computeGeneralInterviewTotalScore(row)).toBeNull()
  })

  it('treats single evaluator as unevaluated', () => {
    const row = { managerAScore: 4, managerBScore: null }
    expect(isGeneralInterviewTotalScoreUnevaluated(row)).toBe(true)
    expect(computeGeneralInterviewTotalScore(row)).toBeNull()
  })

  it('treats both zero as evaluated total 0', () => {
    const row = { managerAScore: 0, managerBScore: 0 }
    expect(isGeneralInterviewTotalScoreUnevaluated(row)).toBe(false)
    expect(computeGeneralInterviewTotalScore(row)).toBe(0)
  })

  it('sums both evaluator scores when complete', () => {
    const row = { managerAScore: 3, managerBScore: 4 }
    expect(computeGeneralInterviewTotalScore(row)).toBe(7)
  })
})

describe('parseGeneralInterviewSlotEndFromRow', () => {
  it('prefers assignedInterviewEndAt over display strings', () => {
    const end = parseGeneralInterviewSlotEndFromRow({
      assignedInterviewEndAt: '2026-04-10T11:00:00+09:00',
      assignedInterviewDateLabel: '2026.04.10',
      assignedInterviewTime: '10:00 ~ 10:30',
    })
    expect(end?.format('YYYY-MM-DD HH:mm')).toBe('2026-04-10 11:00')
  })

  it('falls back to label parsing when endAt missing', () => {
    const end = parseGeneralInterviewSlotEndFromRow({
      assignedInterviewDateLabel: '2026.04.10',
      assignedInterviewTime: '10:00 ~ 11:00',
    })
    expect(end?.hour()).toBe(11)
    expect(end?.minute()).toBe(0)
  })
})

describe('resolveGeneralEffectiveSecondInterviewStatus', () => {
  it('uses endAt for waiting vs completed boundary', () => {
    const row = {
      interviewAssignmentStatus: 'assigned',
      secondInterviewScreeningStatus: undefined,
      assignedInterviewEndAt: '2026-04-10T11:00:00+09:00',
      assignedInterviewDateLabel: '2026.04.10',
      assignedInterviewTime: '10:00 ~ 10:30',
    } as GeneralVolunteerApplicantRow

    const before = dayjs('2026-04-10T10:59:59+09:00')
    const atEnd = dayjs('2026-04-10T11:00:00+09:00')

    expect(resolveGeneralEffectiveSecondInterviewStatus(row, before)).toBe('waiting')
    expect(resolveGeneralEffectiveSecondInterviewStatus(row, atEnd)).toBe('completed')
  })
})
