import { describe, expect, it } from 'vitest'
import { resolveTextbookDeleteConfirmCopy } from './textbook-delete-confirm-copy'

const LINE2 = '삭제된 정보는 되돌릴 수 없습니다.'

describe('resolveTextbookDeleteConfirmCopy', () => {
  it('단건 — [교재명] 교재를', () => {
    expect(resolveTextbookDeleteConfirmCopy(['경제 교실'])).toEqual({
      title: '교재 삭제 안내',
      line1: '**[경제 교실]** 교재를 삭제하시겠습니까?',
      line2: LINE2,
    })
  })

  it('일괄 — [교재명] 외 N개의 교재를', () => {
    expect(resolveTextbookDeleteConfirmCopy(['경제 교실', '금융 교실', '진로 교실'])).toEqual({
      title: '교재 일괄 삭제 안내',
      line1: '**[경제 교실] 외 2개**의 교재를 삭제하시겠습니까?',
      line2: LINE2,
    })
  })

  it('이름을 모르면 기존 문구', () => {
    expect(resolveTextbookDeleteConfirmCopy([], 1).line1).toBe('해당 교재를 삭제하시겠습니까?')
    expect(resolveTextbookDeleteConfirmCopy([], 3).line1).toBe(
      '**선택한 3개**의 교재를 삭제하시겠습니까?'
    )
  })
})
