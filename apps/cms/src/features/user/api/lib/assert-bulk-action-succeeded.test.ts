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

  it('학교 일괄 삭제 부분 실패는 서버가 준 사용자용 문구를 그대로 throw한다', () => {
    expect(() =>
      assertBulkActionSucceeded(
        {
          requestedCount: 3,
          successCount: 1,
          failureCount: 2,
          successIds: [1],
          failures: [
            {
              id: 2,
              code: 'SCHOOL_HAS_ACTIVE_MEMBERS',
              message: '현재 소속 회원이 있어 학교를 삭제할 수 없습니다.',
            },
            {
              id: 3,
              code: 'SCHOOL_HAS_ACTIVE_TEACHERS',
              message: '현재 소속 중인 교사가 있어 학교를 삭제할 수 없습니다.',
            },
          ],
        },
        '학교 일괄 삭제에 실패했습니다.'
      )
    ).toThrow('현재 소속 회원이 있어 학교를 삭제할 수 없습니다.')
  })

  it('실패 사유가 코드 원문뿐이면 코드를 노출하지 않고 fallback 문구로 throw한다', () => {
    expect(() =>
      assertBulkActionSucceeded(
        {
          requestedCount: 2,
          successCount: 1,
          failureCount: 1,
          successIds: [1],
          failures: [{ id: 2, code: 'STATE_CONFLICT', message: 'STATE_CONFLICT' }],
        },
        '관리자 권한 일괄 승인에 실패했습니다.'
      )
    ).toThrow('관리자 권한 일괄 승인에 실패했습니다.')
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
