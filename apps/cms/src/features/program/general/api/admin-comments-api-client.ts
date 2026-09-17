import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { AdminCommentResponse } from '@/shared/api/generated/members/schemas/adminCommentResponse'
import type { AdminCommentCreateRequest } from '@/shared/api/generated/members/schemas/adminCommentCreateRequest'
import type { AdminCommentUpdateRequest } from '@/shared/api/generated/members/schemas/adminCommentUpdateRequest'

export type AdminCommentTargetType =
  | 'ORGANIZATION_APPLICATION'
  | 'INSTRUCTOR_APPLICATION'
  | 'VOLUNTEER_APPLICATION'
  | (string & {})

function commentUrl(commentId: number): string {
  return `/api/admin/comments/${encodeURIComponent(String(commentId))}`
}

/** GET /api/admin/comments?targetType=&targetId= */
export async function listAdminCommentsByTargetRemote(input: {
  targetType: AdminCommentTargetType
  targetId: number
  screenCode?: string
}): Promise<AdminCommentResponse[]> {
  const data = await unwrapApiBody<AdminCommentResponse[] | { items?: AdminCommentResponse[] }>(
    await customInstance({
      url: '/api/admin/comments',
      method: 'GET',
      params: {
        targetType: input.targetType,
        targetId: input.targetId,
        ...(input.screenCode ? { screenCode: input.screenCode } : {}),
      },
    })
  )
  if (Array.isArray(data)) return data
  return data.items ?? []
}

/** POST /api/admin/comments */
export async function createAdminCommentRemote(
  body: AdminCommentCreateRequest
): Promise<AdminCommentResponse> {
  return unwrapApiBody<AdminCommentResponse>(
    await customInstance({
      url: '/api/admin/comments',
      method: 'POST',
      data: body,
    })
  )
}

/** PATCH /api/admin/comments/{commentId} */
export async function updateAdminCommentRemote(
  commentId: number,
  body: AdminCommentUpdateRequest
): Promise<AdminCommentResponse> {
  return unwrapApiBody<AdminCommentResponse>(
    await customInstance({
      url: commentUrl(commentId),
      method: 'PATCH',
      data: body,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

/** DELETE /api/admin/comments/{commentId} */
export async function deleteAdminCommentRemote(commentId: number): Promise<void> {
  await customInstance({
    url: commentUrl(commentId),
    method: 'DELETE',
  })
}

function sortCommentsNewestFirst(
  comments: AdminCommentResponse[]
): AdminCommentResponse[] {
  return [...comments].sort((a, b) => {
    const at = Date.parse(b.updatedAt ?? b.createdAt ?? '') || 0
    const bt = Date.parse(a.updatedAt ?? a.createdAt ?? '') || 0
    return at - bt
  })
}

/** 최신 코멘트 행 (createdAt/updatedAt 내림차순) */
export function resolveLatestAdminComment(
  comments: AdminCommentResponse[] | undefined
): AdminCommentResponse | undefined {
  if (!comments?.length) return undefined
  return sortCommentsNewestFirst(comments)[0]
}

/** 최신 코멘트 본문 (createdAt/updatedAt 내림차순) */
export function resolveLatestAdminCommentText(
  comments: AdminCommentResponse[] | undefined
): string | undefined {
  const text = resolveLatestAdminComment(comments)?.comment?.trim()
  return text || undefined
}

export type UpsertAdminCommentByTargetInput = {
  targetType: AdminCommentTargetType
  targetId: number
  /** Create 시 필수. Update/Delete에는 불필요하나 신규 POST에 사용 */
  screenCode: string
  /** trim 후 빈 문자열이면 최신 코멘트 DELETE (없으면 no-op) */
  comment: string
}

export type UpsertAdminCommentByTargetResult = {
  commentText: string | undefined
  comment: AdminCommentResponse | null
}

/**
 * 대상별 관리자 코멘트 upsert.
 * - 본문 있음 + 최신 commentId → PATCH
 * - 본문 있음 + 없음 → POST
 * - 본문 빈값 + 최신 commentId → DELETE
 * - 본문 빈값 + 없음 → no-op
 */
export async function upsertAdminCommentByTargetRemote(
  input: UpsertAdminCommentByTargetInput
): Promise<UpsertAdminCommentByTargetResult> {
  const trimmed = input.comment.trim()
  const existing = await listAdminCommentsByTargetRemote({
    targetType: input.targetType,
    targetId: input.targetId,
    screenCode: input.screenCode,
  })
  const latest = resolveLatestAdminComment(existing)
  const latestId = latest?.commentId

  if (!trimmed) {
    if (typeof latestId === 'number' && Number.isFinite(latestId)) {
      await deleteAdminCommentRemote(latestId)
    }
    return { commentText: undefined, comment: null }
  }

  if (typeof latestId === 'number' && Number.isFinite(latestId)) {
    const updated = await updateAdminCommentRemote(latestId, { comment: trimmed })
    return {
      commentText: updated.comment?.trim() || trimmed,
      comment: updated,
    }
  }

  const created = await createAdminCommentRemote({
    targetType: input.targetType,
    targetId: input.targetId,
    screenCode: input.screenCode,
    comment: trimmed,
  })
  return {
    commentText: created.comment?.trim() || trimmed,
    comment: created,
  }
}
