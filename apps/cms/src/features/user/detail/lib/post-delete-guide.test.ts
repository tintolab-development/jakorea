import { describe, expect, it } from 'vitest'
import { buildPostDeleteGuideLines, buildPostDeletePreviewText } from './post-delete-guide'

const FALLBACK = ['해당 게시글을 삭제하시겠습니까?', '삭제된 정보는 되돌릴 수 없습니다.']

describe('게시글 삭제 안내 대상 글 앞부분 (시안 19)', () => {
  it('마크다운·태그·대괄호를 걷어내고 30자로 자른다', () => {
    expect(buildPostDeletePreviewText('**[공지]** <p>최근 과제 제출 시 다른 반 친구의 과제를 그대로 카피</p>')).toBe(
      '공지 최근 과제 제출 시 다른 반 친구의 과제를 그대로...'
    )
  })

  it('본문이 있으면 첫 줄에 대상 글을 넣는다', () => {
    expect(buildPostDeleteGuideLines({ content: '1회차 안내' }, FALLBACK)).toEqual([
      '[1회차 안내] 게시글을 삭제하시겠습니까?',
      '삭제된 정보는 되돌릴 수 없습니다.',
    ])
  })

  it('본문이 비면 기본 문구', () => {
    expect(buildPostDeleteGuideLines({ content: '' }, FALLBACK)).toBe(FALLBACK)
  })
})
