import { describe, expect, it } from 'vitest'
import { resolveTextbookDeleteConfirmCopy } from './textbook-delete-confirm-copy'

const LINE2 = '삭제된 정보는 되돌릴 수 없습니다.'

describe('resolveTextbookDeleteConfirmCopy', () => {
  it('단건 — 시안', () => {
    expect(resolveTextbookDeleteConfirmCopy('single')).toEqual({
      title: '교재 삭제 안내',
      line1: '해당 교재를 삭제하시겠습니까?',
      line2: LINE2,
    })
  })

  it('일괄', () => {
    expect(resolveTextbookDeleteConfirmCopy('bulk', 3)).toEqual({
      title: '교재 일괄 삭제 안내',
      line1: '**선택한 3개**의 교재를 삭제하시겠습니까?',
      line2: LINE2,
    })
  })
})
