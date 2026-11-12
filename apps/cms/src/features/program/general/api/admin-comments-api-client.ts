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
  /** 등록(POST)·삭제 대상 조회에 사용 */
  screenCode: string
  /** trim 후 빈 문자열이면 기존 코멘트 DELETE (없으면 no-op) */
  comment: string
}

export type UpsertAdminCommentByTargetResult = {
  commentText: string | undefined
  comment: AdminCommentResponse | null
}

/**
 * 대상별 관리자 코멘트 저장.
 * 코멘트는 대상·화면(screenCode)마다 1건이고 등록 API를 다시 호출하면 서버가 덮어쓴다 (QA-0044).
 * - 본문 있음 → POST (기존 코멘트 조회·PATCH 분기 없음)
 * - 본문 빈값 + 기존 commentId → DELETE
 * - 본문 빈값 + 없음 → no-op
 */
export async function upsertAdminCommentByTargetRemote(
  input: UpsertAdminCommentByTargetInput
): Promise<UpsertAdminCommentByTargetResult> {
  const trimmed = input.comment.trim()

  if (!trimmed) {
    const existing = await listAdminCommentsByTargetRemote({
      targetType: input.targetType,
      targetId: input.targetId,
      screenCode: input.screenCode,
    })
    const existingId = resolveLatestAdminComment(existing)?.commentId
    if (typeof existingId === 'number' && Number.isFinite(existingId)) {
      await deleteAdminCommentRemote(existingId)
    }
    return { commentText: undefined, comment: null }
  }

  const saved = await createAdminCommentRemote({
    targetType: input.targetType,
    targetId: input.targetId,
    screenCode: input.screenCode,
    comment: trimmed,
  })
  return {
    commentText: saved.comment?.trim() || trimmed,
    comment: saved,
  }
}
