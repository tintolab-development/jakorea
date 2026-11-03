import type { UUID } from '@/types'
import type {
  ProgramFile,
  ProgramPost,
  ProgramPostComment,
  ProgramPostReaction,
  ProgramPostReactionUser,
  ProgramPostReadRow,
} from '@/types/domain'

export function getCommentsByPostId(_postId: UUID): ProgramPostComment[] {
  void _postId
  return []
}

export function getReactionsByPostId(_postId: UUID): ProgramPostReaction[] {
  void _postId
  return []
}

export function getReactionUsersByPostId(_postId: UUID): ProgramPostReactionUser[] {
  void _postId
  return []
}

export function getReactionTotalCountByPostId(_postId: UUID): number {
  void _postId
  return 0
}

export function getPostViewCountByPostId(_postId: UUID): number {
  void _postId
  return 0
}

export function markPostAsRead(_postId: UUID): void {
  void _postId
}

export function getPostReadRows(
  _postId: UUID,
  _programId?: UUID,
  _schoolScope?: string | null
): ProgramPostReadRow[] {
  void _postId
  void _programId
  void _schoolScope
  return []
}

export function getReadUnreadCountsForPost(
  _postId: UUID,
  _programId?: UUID,
  _schoolScope?: string | null
): { read: number; unread: number } {
  void _postId
  void _programId
  void _schoolScope
  return { read: 0, unread: 0 }
}

export function createProgramPostComment(
  _postId: UUID,
  authorOrContent: string,
  content?: string,
  _options?: { emojiType?: string; reactionRoleLabel?: string }
): ProgramPostComment {
  const resolvedContent = content ?? authorOrContent
  return {
    id: 'stub-comment',
    postId: _postId,
    authorName: typeof content === 'string' ? authorOrContent : '나',
    content: resolvedContent,
    createdAt: new Date().toISOString(),
  }
}

export function addProgramPostReaction(
  _postId: UUID,
  _authorName: string,
  _emojiType: string,
  _options?: { roleLabel?: string }
): void {
  void _postId
  void _authorName
  void _emojiType
  void _options
}

export function removeProgramPostReactionUser(_postId: UUID, _userId: string): boolean {
  void _postId
  void _userId
  return false
}

export function createProgramPost(_data: Partial<ProgramPost> & { programId: UUID }): ProgramPost {
  void _data
  throw new Error('프로그램 게시글 작성 API를 사용하세요.')
}

export function addProgramFiles(
  _programId: UUID,
  _postId: UUID,
  _files: Array<{ fileName: string; fileUrl?: string; fileSize?: number }>
): void {
  void _programId
  void _postId
  void _files
  throw new Error('프로그램 파일 API를 사용하세요.')
}

export type { ProgramFile }
