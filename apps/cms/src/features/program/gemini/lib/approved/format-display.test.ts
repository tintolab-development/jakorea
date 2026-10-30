import { describe, expect, it } from 'vitest'
import {
  formatConfirmedTrainingDatetimeDisplay,
  formatTrainingDatetimeDisplay,
} from './format-display'
import type { GeminiApprovedTrainingDateCandidate } from '../../model/approved/types'

const candidates: GeminiApprovedTrainingDateCandidate[] = [
  { preferenceRank: 1, trainingDate: '2026-11-10', trainingTimeText: '10:00~12:00(1차시)' },
  { preferenceRank: 2, trainingDate: '2026-11-12', trainingTimeText: '10:00~12:00(1차시)' },
  { preferenceRank: 3, trainingDate: '2026-11-17', trainingTimeText: '' },
]

describe('formatTrainingDatetimeDisplay', () => {
  it('확정 일정이 있으면 확정 일정만 표시한다', () => {
    const row = {
      instructorAssigned: true,
      trainingDate: '2026-11-10',
      trainingTimeText: '10:00~12:00',
      trainingDateCandidates: candidates,
      lastPreferredDate: '2026-11-17',
    }
    expect(formatTrainingDatetimeDisplay(row)).toBe('2026.11.10 | 10:00~12:00')
    expect(formatConfirmedTrainingDatetimeDisplay(row)).toBe('2026.11.10 | 10:00~12:00')
  })

  it('미확정이면 희망 일정 후보를 지망 순으로 표시한다', () => {
    const row = {
      instructorAssigned: false,
      trainingDate: '',
      trainingTimeText: '',
      trainingDateCandidates: candidates,
      lastPreferredDate: '2026-11-17',
    }
    expect(formatTrainingDatetimeDisplay(row)).toBe(
      '1지망 11/10 10:00~12:00(1차시) | 2지망 11/12 10:00~12:00(1차시) | 3지망 11/17'
    )
    expect(formatConfirmedTrainingDatetimeDisplay(row)).toBe(
      '2026.11.10 | 10:00~12:00(1차시)'
    )
  })

  it('강사 미지정이어도 승인 연수일시는 한 줄로 보여 준다', () => {
    expect(
      formatConfirmedTrainingDatetimeDisplay({
        instructorAssigned: false,
        trainingDate: '2026-10-08',
        trainingTimeText: '01:00~02:00(1차시)',
        trainingDateCandidates: candidates,
      })
    ).toBe('2026.10.08 | 01:00~02:00(1차시)')
  })

  it('강사가 매칭됐어도 확정 날짜가 없으면 후보를 표시한다', () => {
    expect(
      formatTrainingDatetimeDisplay({
        instructorAssigned: true,
        trainingDate: '',
        trainingTimeText: '',
        trainingDateCandidates: candidates.slice(0, 1),
        lastPreferredDate: '2026-11-10',
      })
    ).toBe('1지망 11/10 10:00~12:00(1차시)')
  })

  it('확정 일정과 후보가 모두 없으면 - 를 표시한다', () => {
    expect(
      formatTrainingDatetimeDisplay({
        instructorAssigned: false,
        trainingDate: '',
        trainingTimeText: '',
        trainingDateCandidates: [],
        lastPreferredDate: '',
      })
    ).toBe('-')
  })

  it('후보가 없고 lastPreferredDate만 있으면 그 날짜를 표시한다', () => {
    expect(
      formatTrainingDatetimeDisplay({
        instructorAssigned: true,
        trainingDate: '',
        trainingTimeText: '',
        trainingDateCandidates: [],
        lastPreferredDate: '2026-11-10',
      })
    ).toBe('2026.11.10')
  })

  it('확정 날짜만 있고 시각이 없으면 날짜만 표시한다', () => {
    expect(
      formatConfirmedTrainingDatetimeDisplay({
        instructorAssigned: true,
        trainingDate: '2026-10-29',
        trainingTimeText: '',
        trainingDateCandidates: [],
      })
    ).toBe('2026.10.29')
  })
})
