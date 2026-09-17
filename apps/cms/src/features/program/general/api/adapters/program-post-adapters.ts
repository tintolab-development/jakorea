/**
 * 일반 프로그램 게시글 DTO → domain 어댑터
 */

import type { ProgramFile, ProgramPost, ProgramPostComment, ProgramPostReaction } from '@/types/domain'
import type { ProgramPostListItemResponse } from '@/shared/api/generated/dashboard/schemas/programPostListItemResponse'
import type { ProgramPostResponse } from '@/shared/api/generated/dashboard/schemas/programPostResponse'
import type { ProgramPostCommentResponse } from '@/shared/api/generated/dashboard/schemas/programPostCommentResponse'
import type { ProgramPostAttachmentResponse } from '@/shared/api/generated/dashboard/schemas/programPostAttachmentResponse'
import type { ProgramPostReactionSummaryResponse } from '@/shared/api/generated/dashboard/schemas/programPostReactionSummaryResponse'
import { contentUrlForFileObjectId } from '@/shared/lib/admin-file-upload'

function resolvePostAuthorName(actorType: string | undefined): string {
  const normalized = (actorType ?? '').trim().toUpperCase()
  if (!normalized || normalized === 'ADMIN' || normalized === 'SYSTEM' || normalized === 'CMS') {
    return 'JA KOREA 알림'
  }
  return 'JA KOREA 알림'
}

function mapVisibilityToAudience(visibilityType: string | undefined): string[] | undefined {
  const raw = visibilityType?.trim()
  if (!raw) return undefined
  if (raw.toUpperCase() === 'ALL') return ['all']
  return raw
    .split(',')
    .map(part => part.trim().toLowerCase())
    .filter(Boolean)
}

export function mapProgramPostListItemToDomain(
  dto: ProgramPostListItemResponse,
  programId: string
): ProgramPost {
  const createdAt = dto.createdAt ?? new Date().toISOString()
  const content = dto.content?.trim() ?? ''
  return {
    id: String(dto.postId ?? ''),
    programId,
    authorName: resolvePostAuthorName(dto.createdByActorType),
    createdByActorType: dto.createdByActorType,
    createdByActorId: dto.createdByActorId,
    title: dto.title?.trim() || undefined,
    content: content || (dto.title?.trim() ?? ''),
    read: (dto.unreadCount ?? 0) === 0,
    viewCount: dto.readCount ?? 0,
    reactionCount: dto.reactionCount ?? 0,
    commentCount: dto.commentCount ?? 0,
    attachmentCount: 0,
    audience: mapVisibilityToAudience(dto.visibilityType),
    publishedAt: createdAt,
    createdAt,
    updatedAt: dto.updatedAt ?? createdAt,
  }
}

export function mapProgramPostResponseToDomain(
  dto: ProgramPostResponse,
  programId: string
): ProgramPost {
  const createdAt = dto.createdAt ?? new Date().toISOString()
  const content = dto.content?.trim() ?? ''
  return {
    id: String(dto.id ?? ''),
    programId: dto.programId != null ? String(dto.programId) : programId,
    authorName: resolvePostAuthorName(dto.createdByActorType),
    createdByActorType: dto.createdByActorType,
    createdByActorId: dto.createdByActorId,
    title: dto.title?.trim() || undefined,
    content: content || (dto.title?.trim() ?? ''),
    read: (dto.unreadCount ?? 0) === 0,
    viewCount: dto.readCount ?? 0,
    reactionCount: dto.reactionCount ?? 0,
    commentCount: dto.commentCount ?? 0,
    attachmentCount: 0,
    audience: mapVisibilityToAudience(dto.visibilityType),
    publishedAt: createdAt,
    createdAt,
    updatedAt: dto.updatedAt ?? createdAt,
  }
}

export function mapProgramPostCommentToDomain(
  dto: ProgramPostCommentResponse,
  postId: string
): ProgramPostComment {
  return {
    id: String(dto.id ?? ''),
    postId: dto.postId != null ? String(dto.postId) : postId,
    authorName: resolvePostAuthorName(dto.createdByActorType),
    content: dto.content?.trim() ?? '',
    createdAt: dto.createdAt ?? new Date().toISOString(),
  }
}

export function mapProgramPostReactionSummariesToDomain(
  summaries: ProgramPostReactionSummaryResponse[] | undefined,
  postId: string
): ProgramPostReaction[] {
  return (summaries ?? [])
    .filter(row => (row.count ?? 0) > 0 && Boolean(row.reactionType?.trim()))
    .map(row => ({
      id: `${postId}-${row.reactionType}`,
      postId,
      emojiType: row.reactionType!.trim(),
      count: row.count ?? 0,
    }))
}

export function mapProgramPostAttachmentToFile(
  dto: ProgramPostAttachmentResponse,
  programId: string
): ProgramFile | null {
  const fileObjectId = dto.fileObjectId
  if (fileObjectId == null) return null
  const fileName = dto.originalFileName?.trim() || `file-${fileObjectId}`
  const uploadedAt = dto.createdAt ?? new Date().toISOString()
  return {
    id: String(dto.attachmentId ?? fileObjectId),
    programId: dto.programId != null ? String(dto.programId) : programId,
    postId: dto.postId != null ? String(dto.postId) : undefined,
    fileName,
    fileType: dto.mimeType?.split('/').pop() ?? fileName.split('.').pop(),
    fileSize: dto.fileSize,
    fileUrl: contentUrlForFileObjectId(fileObjectId),
    uploadedAt,
    createdAt: uploadedAt,
    updatedAt: uploadedAt,
  }
}
