/**
 * 프로그램 게시글 댓글·반응 Mock 데이터
 * 게시글 상세 모달 — 댓글 카드, 이모지/반응 뷰어 연동
 */

import type { UUID } from '../../types'
import type { ProgramPostComment, ProgramPostReaction, ProgramPostReactionUser } from '../../types/domain'
import { mockProgramPosts } from './program-posts'

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

const REACTION_ROLE_LABELS = ['학생', '관리자', '강사', '대표 강사', '담당교사'] as const
const REACTION_EMOJI_TYPES = [
  'smile',
  'laugh',
  'loveFace',
  'surprised',
  'cry',
  'angry',
  'scream',
  'heart',
  'clap',
  'thumbsUp',
  'check',
] as const

/** postId별 반응 사용자 목록 생성 (합 = reactionCount) */
function buildReactionUsers(): ProgramPostReactionUser[] {
  const rows: ProgramPostReactionUser[] = []
  let idSeq = 1
  mockProgramPosts.forEach(post => {
    const total = post.reactionCount
    if (total <= 0) return
    const publishedTime = new Date(post.publishedAt).getTime()
    for (let i = 0; i < total; i++) {
      const authorName = COMMENT_AUTHORS[(idSeq + i) % COMMENT_AUTHORS.length]
      const roleLabel = REACTION_ROLE_LABELS[(idSeq + i) % REACTION_ROLE_LABELS.length]
      const emojiType = REACTION_EMOJI_TYPES[(idSeq + i) % REACTION_EMOJI_TYPES.length]
      rows.push({
        id: `preaction-user-${String(idSeq).padStart(4, '0')}` as UUID,
        postId: post.id,
        authorName,
        roleLabel,
        emojiType,
        createdAt: new Date(publishedTime + (i + 1) * 1800000).toISOString(),
      })
      idSeq += 1
    }
  })
  return rows
}

/** 사용자 반응 row를 이모지 타입별 count로 집계 */
function buildReactionsFromUsers(users: ProgramPostReactionUser[]): ProgramPostReaction[] {
  const counter = new Map<string, number>()
  users.forEach(user => {
    const key = `${user.postId}::${user.emojiType}`
    counter.set(key, (counter.get(key) ?? 0) + 1)
  })
  let seq = 1
  const reactions: ProgramPostReaction[] = []
  counter.forEach((count, key) => {
    const [postId, emojiType] = key.split('::')
    reactions.push({
      id: `preaction-${String(seq).padStart(4, '0')}` as UUID,
      postId: postId as UUID,
      emojiType,
      count,
    })
    seq += 1
  })
  return reactions
}

export const mockProgramPostComments: ProgramPostComment[] = buildComments()
export const mockProgramPostReactionUsers: ProgramPostReactionUser[] = buildReactionUsers()
export const mockProgramPostReactions: ProgramPostReaction[] = buildReactionsFromUsers(mockProgramPostReactionUsers)

/** 반응 사용자 row 수 = 이모지별 count 합. 게시글의 reactionCount와 목록/팝업 숫자를 일치시킴 */
function syncReactionCountsFromReactionUsers(): void {
  const totals = new Map<UUID, number>()
  for (const row of mockProgramPostReactionUsers) {
    totals.set(row.postId, (totals.get(row.postId) ?? 0) + 1)
  }
  for (const post of mockProgramPosts) {
    post.reactionCount = totals.get(post.id) ?? 0
  }
}
syncReactionCountsFromReactionUsers()

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

const reactionUsersByPostId = new Map<UUID, ProgramPostReactionUser[]>()
mockProgramPostReactionUsers.forEach(r => {
  const list = reactionUsersByPostId.get(r.postId) ?? []
  list.push(r)
  reactionUsersByPostId.set(r.postId, list)
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

/** 이모지 타입별 count 합 (= 반응 사용자 수). 메타 숫자와 팝업 집계와 동일 소스 */
export function getReactionTotalCountByPostId(postId: UUID): number {
  const list = reactionsByPostId.get(postId) ?? []
  return list.reduce((sum, r) => sum + r.count, 0)
}

/** 게시글 ID로 반응 사용자 목록 조회 */
export function getReactionUsersByPostId(postId: UUID): ProgramPostReactionUser[] {
  return (reactionUsersByPostId.get(postId) ?? []).slice()
}
