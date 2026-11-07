import { describe, expect, it } from 'vitest'
import type { GeminiApprovedTrainingDetail } from '../../model/approved/detail-types'
import { formatDetailTrainingDatetime } from './detail-program-info-tab'

const baseDetail = {
  instructorAssigned: true,
  trainingDate: '2026-01-09',
  trainingTimeText: '09:00~11:20',
  classCount: 2,
} as GeminiApprovedTrainingDetail

describe('formatDetailTrainingDatetime', () => {
  it('formats the remote date, time, and class count in the approved-detail format', () => {
    expect(formatDetailTrainingDatetime(baseDetail)).toBe('2026.01.09(금) | 09:00~11:20 (2차시)')
  })

  it('강사 미배정이면 API 일정이 있어도 - 이다', () => {
    expect(
      formatDetailTrainingDatetime({
        ...baseDetail,
        instructorAssigned: false,
      })
    ).toBe('-')
  })

  it('does not use preferred schedule data when the remote confirmed date is absent', () => {
    expect(
      formatDetailTrainingDatetime({
        ...baseDetail,
        trainingDate: '',
        trainingDateCandidates: [
          { preferenceRank: 1, trainingDate: '2026-01-09', trainingTimeText: '' },
        ],
      })
    ).toBe('-')
  })
})
