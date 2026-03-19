/**
 * 프로그램 게시글 댓글·반응 Mock 데이터
 * 게시글 상세 모달 — 댓글 카드, 이모지/반응 뷰어 연동
 */

import type { UUID } from '../../types'
import type { ProgramPostComment, ProgramPostReaction } from '../../types/domain'
import { mockProgramPosts } from './program-posts'

function isoDate(daysAgo: number, hour: number, minute: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const COMMENT_AUTHORS = ['김○○', '최○○', '이○○', '정○○', '박○○', '강○○', 'JA KOREA 알림']
const COMMENT_CONTENTS = [
  '확인했습니다!',
  '넵~~',
  '감사합니다!',
  '알겠습니다.',
  '잘 봤어요.',
  '필요한 내용 잘 공유해 주셔서 감사합니다.',
  '담당교사님 말씀대로 진행하겠습니다.',
]

/** postId별 댓글 목록 생성 (mock 게시글의 commentCount와 맞춤) */
function buildComments(): ProgramPostComment[] {
  const comments: ProgramPostComment[] = []
  let idSeq = 1
  mockProgramPosts.forEach(post => {
    const n = post.commentCount
    const publishedTime = new Date(post.publishedAt).getTime()
    for (let i = 0; i < n; i++) {
      const authorIdx = (idSeq + i) % COMMENT_AUTHORS.length
      const contentIdx = (idSeq + i) % COMMENT_CONTENTS.length
      const createdAt = new Date(publishedTime + (i + 1) * 3600000).toISOString()
      comments.push({
        id: `pcomment-${String(idSeq).padStart(4, '0')}` as UUID,
        postId: post.id,
        authorName: COMMENT_AUTHORS[authorIdx],
        content: COMMENT_CONTENTS[contentIdx],
        createdAt,
      })
      idSeq += 1
    }
  })
  return comments
}

/** postId별 반응 목록 생성 (이모지 타입별 count, 합 = reactionCount) */
function buildReactions(): ProgramPostReaction[] {
  const reactions: ProgramPostReaction[] = []
  const emojiTypes = ['like', 'heart', 'clap'] as const
  let idSeq = 1
  mockProgramPosts.forEach(post => {
    const total = post.reactionCount
    if (total <= 0) return
    const c1 = Math.min(total, Math.floor(total * 0.5) || 1)
    const c2 = total - c1 > 0 ? Math.min(total - c1, Math.floor((total - c1) * 0.6) || 1) : 0
    const c3 = total - c1 - c2
    const counts = [c1, c2, c3].filter(c => c > 0)
    counts.forEach((c, i) => {
      reactions.push({
        id: `preaction-${String(idSeq).padStart(4, '0')}` as UUID,
        postId: post.id,
        emojiType: emojiTypes[i % emojiTypes.length],
        count: c,
      })
      idSeq += 1
    })
  })
  return reactions
}

export const mockProgramPostComments: ProgramPostComment[] = buildComments()
export const mockProgramPostReactions: ProgramPostReaction[] = buildReactions()

const commentsByPostId = new Map<UUID, ProgramPostComment[]>()
mockProgramPostComments.forEach(c => {
  const list = commentsByPostId.get(c.postId) ?? []
  list.push(c)
  commentsByPostId.set(c.postId, list)
})
// 작성일시순 정렬
commentsByPostId.forEach(list =>
  list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
)

const reactionsByPostId = new Map<UUID, ProgramPostReaction[]>()
mockProgramPostReactions.forEach(r => {
  const list = reactionsByPostId.get(r.postId) ?? []
  list.push(r)
  reactionsByPostId.set(r.postId, list)
})

/** 게시글 ID로 댓글 목록 조회 (작성일시순) */
export function getCommentsByPostId(postId: UUID): ProgramPostComment[] {
  return (commentsByPostId.get(postId) ?? []).slice()
}

/** 댓글 등록 (Mock: in-memory 추가 후 목록에 반영) */
export function createProgramPostComment(
  postId: UUID,
  authorName: string,
  content: string
): ProgramPostComment {
  const now = new Date().toISOString()
  const id = `pcomment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` as UUID
  const comment: ProgramPostComment = {
    id,
    postId,
    authorName: authorName.trim(),
    content: content.trim(),
    createdAt: now,
  }
  mockProgramPostComments.push(comment)
  const list = commentsByPostId.get(postId) ?? []
  list.push(comment)
  commentsByPostId.set(postId, list)
  list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  return comment
}

/** 게시글 ID로 반응(이모지) 목록 조회 */
export function getReactionsByPostId(postId: UUID): ProgramPostReaction[] {
  return (reactionsByPostId.get(postId) ?? []).slice()
}
