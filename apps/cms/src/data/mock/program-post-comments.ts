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
/** 이모지 바(Figma 순)와 동일 — 댓글·반응 집계에서 공통 키로 사용 */
export const REACTION_EMOJI_TYPES = [
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

export function getReactionEmojiTypeForBarIndex(index: number): string | undefined {
  if (!Number.isInteger(index) || index < 0 || index >= REACTION_EMOJI_TYPES.length) {
    return undefined
  }
  return REACTION_EMOJI_TYPES[index]
}

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

export interface CreateProgramPostCommentOptions {
  /** 선택 이모지 — 댓글 본문에는 넣지 않고, 상단 게시글 반응 영역 집계만 반영 */
  emojiType?: string
  /** 반응 팝업에 표시할 역할 라벨 */
  reactionRoleLabel?: string
}

function appendReactionUserForPost(
  postId: UUID,
  authorName: string,
  emojiType: string,
  roleLabel: string
): UUID {
  const now = new Date().toISOString()
  const id = `preaction-user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` as UUID
  const row: ProgramPostReactionUser = {
    id,
    postId,
    authorName: authorName.trim(),
    roleLabel,
    emojiType,
    createdAt: now,
  }
  mockProgramPostReactionUsers.push(row)
  const ulist = reactionUsersByPostId.get(postId) ?? []
  ulist.push(row)
  reactionUsersByPostId.set(postId, ulist)
  ulist.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const rlist = reactionsByPostId.get(postId) ?? []
  const existing = rlist.find(r => r.emojiType === emojiType)
  if (existing) {
    existing.count += 1
  } else {
    const rid = `preaction-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` as UUID
    rlist.push({ id: rid, postId, emojiType, count: 1 })
  }
  rlist.sort((a, b) => b.count - a.count)
  reactionsByPostId.set(postId, rlist)

  const post = mockProgramPosts.find(p => p.id === postId)
  if (post) {
    post.reactionCount = ulist.length
    post.updatedAt = now
  }
  return id
}

/** 댓글 등록 (Mock: in-memory 추가 후 목록에 반영) */
export function createProgramPostComment(
  postId: UUID,
  authorName: string,
  content: string,
  options?: CreateProgramPostCommentOptions
): ProgramPostComment {
  const now = new Date().toISOString()
  const id = `pcomment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}` as UUID
  const emojiType = options?.emojiType?.trim()
  const comment: ProgramPostComment = {
    id,
    postId,
    authorName: authorName.trim(),
    content: content.trim(),
    createdAt: now,
  }
  if (emojiType) {
    appendReactionUserForPost(
      postId,
      comment.authorName,
      emojiType,
      options?.reactionRoleLabel?.trim() || '학생'
    )
  }
  mockProgramPostComments.push(comment)
  const list = commentsByPostId.get(postId) ?? []
  list.push(comment)
  commentsByPostId.set(postId, list)
  list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  return comment
}

/** 반응 목록에서 한 행 제거(본인 행만 UI에서 호출). 집계만 갱신 */
export function removeProgramPostReactionUser(postId: UUID, reactionUserId: UUID): boolean {
  const idx = mockProgramPostReactionUsers.findIndex(r => r.id === reactionUserId && r.postId === postId)
  if (idx === -1) return false
  const removed = mockProgramPostReactionUsers[idx]!
  mockProgramPostReactionUsers.splice(idx, 1)

  const ulist = reactionUsersByPostId.get(postId) ?? []
  const ui = ulist.findIndex(r => r.id === reactionUserId)
  if (ui !== -1) ulist.splice(ui, 1)
  reactionUsersByPostId.set(postId, ulist)

  const rlist = reactionsByPostId.get(postId) ?? []
  const agg = rlist.find(r => r.emojiType === removed.emojiType)
  if (agg) {
    agg.count -= 1
    if (agg.count <= 0) {
      const ri = rlist.indexOf(agg)
      if (ri !== -1) rlist.splice(ri, 1)
    }
  }
  rlist.sort((a, b) => b.count - a.count)
  reactionsByPostId.set(postId, rlist)

  const updatedAt = new Date().toISOString()
  const post = mockProgramPosts.find(p => p.id === postId)
  if (post) {
    post.reactionCount = ulist.length
    post.updatedAt = updatedAt
  }

  return true
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
