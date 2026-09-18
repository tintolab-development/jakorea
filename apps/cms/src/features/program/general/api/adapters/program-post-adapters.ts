/**
 * 일반 프로그램 게시글 DTO → domain 어댑터
 */

import type {
  ProgramFile,
  ProgramPost,
  ProgramPostComment,
  ProgramPostReaction,
  ProgramPostReactionUser,
  ProgramPostReadRow,
} from '@/types/domain'
import type { ProgramPostListItemResponse } from '@/shared/api/generated/dashboard/schemas/programPostListItemResponse'
import type { ProgramPostResponse } from '@/shared/api/generated/dashboard/schemas/programPostResponse'
import type { ProgramPostCommentResponse } from '@/shared/api/generated/dashboard/schemas/programPostCommentResponse'
import type { ProgramPostAttachmentResponse } from '@/shared/api/generated/dashboard/schemas/programPostAttachmentResponse'
import type { ProgramPostReactionSummaryResponse } from '@/shared/api/generated/dashboard/schemas/programPostReactionSummaryResponse'
import type { ProgramPostReactionResponse } from '@/shared/api/generated/dashboard/schemas/programPostReactionResponse'
import type { ProgramPostReadsResponse } from '@/shared/api/generated/dashboard/schemas/programPostReadsResponse'
import { contentUrlForFileObjectId } from '@/shared/lib/admin-file-upload'

function mapActorRoleLabel(actorType: string | undefined): string {
  const normalized = (actorType ?? '').trim().toUpperCase()
  switch (normalized) {
    case 'ADMIN':
    case 'CMS':
    case 'SYSTEM':
      return '관리자'
    case 'TEACHER':
    case 'SCHOOL':
    case 'ORGANIZATION':
      return '담당교사'
    case 'INSTRUCTOR':
      return '강사'
    case 'STUDENT':
    case 'MEMBER':
      return '참여자'
    case 'VOLUNTEER':
      return '봉사자'
    default:
      return normalized || '회원'
  }
}

/** displayName 미제공 시 역할 + actorId 폴백 (BE enrich 전까지) */
function resolveActorDisplayName(
  actorType: string | undefined,
  actorId: number | undefined,
  displayName?: string | null
): string {
  const named = displayName?.trim()
  if (named) return named
  const role = mapActorRoleLabel(actorType)
  if (actorId != null) return `${role} #${actorId}`
  return role
}

function resolvePostAuthorName(
  actorType: string | undefined,
  actorId?: number,
  displayName?: string | null
): string {
  const normalized = (actorType ?? '').trim().toUpperCase()
  if (!normalized || normalized === 'ADMIN' || normalized === 'SYSTEM' || normalized === 'CMS') {
    return displayName?.trim() || 'JA KOREA 알림'
  }
  return resolveActorDisplayName(actorType, actorId, displayName)
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
    authorName: resolvePostAuthorName(dto.createdByActorType, dto.createdByActorId),
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
    authorName: resolvePostAuthorName(dto.createdByActorType, dto.createdByActorId),
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
    authorName: resolvePostAuthorName(dto.createdByActorType, dto.createdByActorId),
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

export function mapProgramPostReactionItemsToUsers(
  items: ProgramPostReactionResponse[] | undefined,
  postId: string
): ProgramPostReactionUser[] {
  return (items ?? [])
    .filter(row => Boolean(row.reactionType?.trim()))
    .map((row, index) => ({
      id: `${postId}-${row.actorType ?? 'actor'}-${row.actorId ?? index}-${row.reactionType}`,
      postId,
      authorName: resolveActorDisplayName(row.actorType, row.actorId),
      roleLabel: mapActorRoleLabel(row.actorType),
      emojiType: row.reactionType!.trim(),
      createdAt: row.createdAt ?? new Date().toISOString(),
    }))
}

export function mapProgramPostReadsToDomainRows(
  dto: ProgramPostReadsResponse,
  postId: string
): ProgramPostReadRow[] {
  const readers: ProgramPostReadRow[] = (dto.readers ?? []).map((row, index) => {
    const actorId = row.readerActorId
    return {
      id: String(actorId ?? row.readId ?? `read-${index}`),
      postId,
      displayName: resolveActorDisplayName(row.readerActorType, actorId),
      roleLabel: mapActorRoleLabel(row.readerActorType),
      hasRead: true,
      readAt: row.lastReadAt ?? row.firstReadAt ?? row.readAt,
    }
  })

  const unread: ProgramPostReadRow[] = (dto.unreadMembers ?? []).map((row, index) => {
    const memberId = row.memberId
    return {
      id: String(memberId ?? `unread-${index}`),
      postId,
      displayName: resolveActorDisplayName(row.targetRole, memberId),
      roleLabel: mapActorRoleLabel(row.targetRole),
      hasRead: false,
    }
  })

  return [...readers, ...unread]
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
