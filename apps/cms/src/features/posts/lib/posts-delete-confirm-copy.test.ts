import { describe, expect, it } from 'vitest'
import { resolvePostsDeleteConfirmCopy } from './posts-delete-confirm-copy'

const LINE2 = '삭제된 정보는 되돌릴 수 없습니다.'

describe('resolvePostsDeleteConfirmCopy', () => {
  it('notice 단건', () => {
    expect(resolvePostsDeleteConfirmCopy('notice', 'single')).toEqual({
      title: '공지사항 삭제 안내',
      line1: '해당 공지사항을 삭제하시겠습니까?',
      line2: LINE2,
    })
  })

  it('notice 일괄', () => {
    expect(resolvePostsDeleteConfirmCopy('notice', 'bulk', 3)).toEqual({
      title: '공지사항 일괄 삭제 안내',
      line1: '선택한 3개의 공지사항을 삭제하시겠습니까?',
      line2: LINE2,
    })
  })

  it('faq 단건·일괄', () => {
    expect(resolvePostsDeleteConfirmCopy('faq', 'single').title).toBe('FAQ 삭제 안내')
    expect(resolvePostsDeleteConfirmCopy('faq', 'bulk', 2).line1).toBe(
      '선택한 2개의 FAQ를 삭제하시겠습니까?'
    )
  })

  it('inquiry 단건·일괄', () => {
    expect(resolvePostsDeleteConfirmCopy('inquiry', 'single')).toEqual({
      title: '문의 삭제 안내',
      line1: '해당 문의를 삭제하시겠습니까?',
      line2: LINE2,
    })
    expect(resolvePostsDeleteConfirmCopy('inquiry', 'bulk', 5).title).toBe(
      '문의 일괄 삭제 안내'
    )
  })
})
