import { describe, expect, it } from 'vitest'
import {
  formatApprovedTrainingDeleteDisplayName,
  formatConfirmedTrainingDatetimeDisplay,
  formatTrainingTimeTextWithClassCount,
  formatTrainingDatetimeDisplay,
  resolveGeminiInstructorApprovalTrainingSummary,
} from './format-display'
import type { GeminiApprovedTrainingDateCandidate } from '../../model/approved/types'

const candidates: GeminiApprovedTrainingDateCandidate[] = [
  { preferenceRank: 1, trainingDate: '2026-11-10', trainingTimeText: '10:00~12:00(1차시)' },
  { preferenceRank: 2, trainingDate: '2026-11-12', trainingTimeText: '10:00~12:00(1차시)' },
  { preferenceRank: 3, trainingDate: '2026-11-17', trainingTimeText: '' },
]

const assignedRow = {
  instructorAssigned: true as const,
  trainingDate: '2026-11-10',
  trainingTimeText: '10:00~12:00',
}

describe('formatTrainingDatetimeDisplay', () => {
  it('강사 배정·확정 일정이 있으면 API 값만 표시한다', () => {
    expect(formatTrainingDatetimeDisplay(assignedRow)).toBe('2026.11.10 | 10:00~12:00')
    expect(formatConfirmedTrainingDatetimeDisplay(assignedRow)).toBe('2026.11.10 | 10:00~12:00')
  })

  it('강사 미배정이면 확정일·후보가 있어도 - 이다', () => {
    expect(
      formatTrainingDatetimeDisplay({
        instructorAssigned: false,
        trainingDate: '2026-11-10',
        trainingTimeText: '10:00~12:00',
      })
    ).toBe('-')
    expect(
      formatConfirmedTrainingDatetimeDisplay({
        instructorAssigned: false,
        trainingDate: '',
        trainingTimeText: '',
      })
    ).toBe('-')
    void candidates
  })

  it('강사 배정 후 확정 날짜만 있으면 날짜만 표시한다', () => {
    expect(
      formatConfirmedTrainingDatetimeDisplay({
        instructorAssigned: true,
        trainingDate: '2026-10-29',
        trainingTimeText: '',
      })
    ).toBe('2026.10.29')
  })

  it('강사 배정 후에도 확정 일정이 없으면 - 이다', () => {
    expect(
      formatTrainingDatetimeDisplay({
        instructorAssigned: true,
        trainingDate: '',
        trainingTimeText: '',
      })
    ).toBe('-')
  })
})

describe('resolveGeminiInstructorApprovalTrainingSummary', () => {
  it('시간 문구는 원문을 유지하고 null 차시는 -로 표시한다', () => {
    expect(formatTrainingTimeTextWithClassCount('10:30~13:00', null)).toBe('10:30~13:00 (-)')
    expect(formatTrainingTimeTextWithClassCount('', 3)).toBe('-')
  })

  it('강사 배정·GET 확정 필드가 있으면 요일·차시로 3분할한다', () => {
    expect(
      resolveGeminiInstructorApprovalTrainingSummary({
        institutionName: '강서초등학교',
        instructorAssigned: true,
        trainingDate: '2026-01-30',
        trainingTimeText: '10:30~13:00',
        classCount: 3,
      })
    ).toEqual({
      institutionName: '강서초등학교',
      trainingDateLabel: '2026.01.30(금)',
      trainingTimeLabel: '10:30~13:00 (3차시)',
    })
  })

  it('강사 미배정이어도 확정 일정이 있으면 날짜·시간을 표시한다', () => {
    expect(
      resolveGeminiInstructorApprovalTrainingSummary({
        institutionName: 'QA 제휴학교',
        instructorAssigned: false,
        trainingDate: '2026-01-30',
        trainingTimeText: '10:30~13:00',
        classCount: 3,
      })
    ).toEqual({
      institutionName: 'QA 제휴학교',
      trainingDateLabel: '2026.01.30(금)',
      trainingTimeLabel: '10:30~13:00 (3차시)',
    })
  })
})

describe('formatApprovedTrainingDeleteDisplayName', () => {
  it('강사 배정·확정일이 있으면 기관명과 요일을 함께 표시한다', () => {
    expect(
      formatApprovedTrainingDeleteDisplayName({
        institutionName: '제이초등학교',
        instructorAssigned: true,
        trainingDate: '2026-01-09',
      })
    ).toBe('제이초등학교 · 2026.01.09(금)')
  })

  it('강사 미배정이면 기관명만 표시한다', () => {
    expect(
      formatApprovedTrainingDeleteDisplayName({
        institutionName: '제이초등학교',
        instructorAssigned: false,
        trainingDate: '2026-01-09',
      })
    ).toBe('제이초등학교')
  })
})
