import { describe, expect, it } from 'vitest'
import {
  isConfirmableStatementStatus,
  isPendingStatementStatus,
  mapStatementStatusToLineStatus,
  mapStatementStatusToProcessingStatus,
} from './settlement-status-mappers'

describe('mapStatementStatusToProcessingStatus', () => {
  it('재신청·혼재 집계를 UI 키로 매핑한다', () => {
    expect(mapStatementStatusToProcessingStatus('REAPPLICATION')).toBe('reapplication')
    expect(mapStatementStatusToProcessingStatus('RESUBMITTED')).toBe('reapplication')
    expect(mapStatementStatusToProcessingStatus('PARTIAL')).toBe('partial')
    expect(mapStatementStatusToProcessingStatus('PARTIAL_CONFIRMED')).toBe('partial')
    expect(mapStatementStatusToProcessingStatus('WAITING_CONFIRM')).toBe('pending')
    expect(mapStatementStatusToProcessingStatus('ISSUED')).toBe('pending')
  })
})

describe('mapStatementStatusToLineStatus', () => {
  it('재신청 라인을 매핑한다', () => {
    expect(mapStatementStatusToLineStatus('REAPPLICATION')).toBe('reapplication')
    expect(mapStatementStatusToLineStatus('WAITING_CONFIRM')).toBe('pending')
  })
})

describe('isPendingStatementStatus', () => {
  it('재신청·발급·확인대기를 지급 대기 건으로 본다', () => {
    expect(isPendingStatementStatus('REQUESTED')).toBe(true)
    expect(isPendingStatementStatus('REAPPLICATION')).toBe(true)
    expect(isPendingStatementStatus('WAITING_CONFIRM')).toBe(true)
    expect(isPendingStatementStatus('ISSUED')).toBe(true)
    expect(isPendingStatementStatus('CONFIRMED')).toBe(false)
  })
})

describe('isConfirmableStatementStatus', () => {
  it('BE bulk-confirm 허용 상태만 true', () => {
    expect(isConfirmableStatementStatus('WAITING_CONFIRM')).toBe(true)
    expect(isConfirmableStatementStatus('REQUESTED')).toBe(true)
    expect(isConfirmableStatementStatus('REAPPLICATION')).toBe(true)
    expect(isConfirmableStatementStatus('ISSUED')).toBe(true)
    expect(isConfirmableStatementStatus('CONFIRMED')).toBe(false)
    expect(isConfirmableStatementStatus('REJECTED')).toBe(false)
  })
})
