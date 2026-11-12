import { describe, expect, it } from 'vitest'
import { assertBulkActionSucceeded } from './assert-bulk-action-succeeded'

describe('assertBulkActionSucceeded', () => {
  it('실패가 없으면 통과한다', () => {
    expect(() =>
      assertBulkActionSucceeded(
        { requestedCount: 1, successCount: 1, failureCount: 0, successIds: [1], failures: [] },
        'fallback'
      )
    ).not.toThrow()
  })

  it('첫 실패의 사용자 문구로 throw한다', () => {
    expect(() =>
      assertBulkActionSucceeded(
        {
          requestedCount: 2,
          successCount: 1,
          failureCount: 1,
          successIds: [1],
          failures: [{ id: 2, code: 'X', message: '처리할 수 없습니다.' }],
        },
        'fallback'
      )
    ).toThrow('처리할 수 없습니다.')
  })

  it('실패 사유가 코드 원문뿐이면(학교 일괄 삭제 부분 실패) fallback 문구로 throw한다', () => {
    expect(() =>
      assertBulkActionSucceeded(
        {
          requestedCount: 2,
          successCount: 1,
          failureCount: 1,
          successIds: [1],
          failures: [
            { id: 2, code: 'SCHOOL_HAS_ACTIVE_MEMBERS', message: 'SCHOOL_HAS_ACTIVE_MEMBERS' },
          ],
        },
        '학교 일괄 삭제에 실패했습니다.'
      )
    ).toThrow('학교 일괄 삭제에 실패했습니다.')
  })

  it('실패 문구가 비면 fallback 문구로 throw한다', () => {
    expect(() =>
      assertBulkActionSucceeded(
        {
          requestedCount: 1,
          successCount: 0,
          failureCount: 1,
          successIds: [],
          failures: [{ id: 1, code: 'STATE_CONFLICT' }],
        },
        'fallback'
      )
    ).toThrow('fallback')
  })
})
