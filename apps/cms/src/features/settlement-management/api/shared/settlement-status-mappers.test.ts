import { describe, expect, it } from 'vitest'
import {
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
  })
})

describe('mapStatementStatusToLineStatus', () => {
  it('재신청 라인을 매핑한다', () => {
    expect(mapStatementStatusToLineStatus('REAPPLICATION')).toBe('reapplication')
  })
})

describe('isPendingStatementStatus', () => {
  it('재신청을 지급 대기 건으로 본다', () => {
    expect(isPendingStatementStatus('REQUESTED')).toBe(true)
    expect(isPendingStatementStatus('REAPPLICATION')).toBe(true)
    expect(isPendingStatementStatus('CONFIRMED')).toBe(false)
  })
})
