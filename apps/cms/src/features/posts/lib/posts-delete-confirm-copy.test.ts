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

  it('notice 단건 — 제목이 있으면 [제목] 공지사항을 삭제', () => {
    expect(resolvePostsDeleteConfirmCopy('notice', 'single', 1, ['2026 하반기 정산 안내'])).toEqual({
      title: '공지사항 삭제 안내',
      line1: '**[2026 하반기 정산 안내]** 공지사항을 삭제하시겠습니까?',
      line2: LINE2,
    })
  })

  it('notice 일괄 — [첫 제목] 외 N개, 1건이면 단건 문구', () => {
    expect(resolvePostsDeleteConfirmCopy('notice', 'bulk', 3, ['첫 공지', '둘째 공지'])).toEqual({
      title: '공지사항 일괄 삭제 안내',
      line1: '**[첫 공지] 외 2개**의 공지사항을 삭제하시겠습니까?',
      line2: LINE2,
    })
    expect(resolvePostsDeleteConfirmCopy('notice', 'bulk', 1, ['첫 공지'])).toEqual({
      title: '공지사항 삭제 안내',
      line1: '**[첫 공지]** 공지사항을 삭제하시겠습니까?',
      line2: LINE2,
    })
  })

  it('긴 제목은 18자까지만 보이고 ...으로 줄인다', () => {
    const long = '가'.repeat(25)
    expect(resolvePostsDeleteConfirmCopy('faq', 'single', 1, [long]).line1).toBe(
      `**[${'가'.repeat(18)}...]** FAQ를 삭제하시겠습니까?`
    )
  })

  it('faq·inquiry 이름 표기', () => {
    expect(resolvePostsDeleteConfirmCopy('faq', 'bulk', 2, ['자주 묻는 질문']).line1).toBe(
      '**[자주 묻는 질문] 외 1개**의 FAQ를 삭제하시겠습니까?'
    )
    expect(resolvePostsDeleteConfirmCopy('inquiry', 'single', 1, ['교재 문의']).line1).toBe(
      '**[교재 문의]** 문의를 삭제하시겠습니까?'
    )
    expect(resolvePostsDeleteConfirmCopy('inquiry', 'bulk', 4, ['교재 문의']).line1).toBe(
      '**[교재 문의] 외 3개**의 문의를 삭제하시겠습니까?'
    )
  })

  it('제목이 비어 있으면 기존 문구', () => {
    expect(resolvePostsDeleteConfirmCopy('notice', 'bulk', 2, ['  ']).line1).toBe(
      '선택한 2개의 공지사항을 삭제하시겠습니까?'
    )
  })
})
