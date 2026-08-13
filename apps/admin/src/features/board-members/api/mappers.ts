import type {
  BoardMember,
  BoardMemberCreateInput,
  BoardRoleGroup,
} from '@/entities/board-members/model/types'
import type { BoardMemberBulkUpdateRequest } from '@/shared/api/generated/ja-korea/schemas/boardMemberBulkUpdateRequest'
import type { BoardMemberCreateRequest } from '@/shared/api/generated/ja-korea/schemas/boardMemberCreateRequest'
import type { BoardMemberResponse } from '@/shared/api/generated/ja-korea/schemas/boardMemberResponse'
import type { BulkDeleteRequest } from '@/shared/api/generated/ja-korea/schemas/bulkDeleteRequest'
import type { PublishedToggleRequest } from '@/shared/api/generated/ja-korea/schemas/publishedToggleRequest'
import type { ToggleRequest } from '@/shared/api/generated/ja-korea/schemas/toggleRequest'
import { BoardMemberCreateRequestRole } from '@/shared/api/generated/ja-korea/schemas/boardMemberCreateRequestRole'
import { BoardMemberResponseRole } from '@/shared/api/generated/ja-korea/schemas/boardMemberResponseRole'
import { BoardMemberUpdateItemRole } from '@/shared/api/generated/ja-korea/schemas/boardMemberUpdateItemRole'

const DOMAIN_TO_API_ROLE = {
  board_chair_president: BoardMemberCreateRequestRole.BOARD_CHAIR_PRESIDENT,
  fiduciary_board_member: BoardMemberCreateRequestRole.FIDUCIARY_BOARD_MEMBER,
  board_chair: BoardMemberCreateRequestRole.BOARD_CHAIR,
} as const satisfies Record<BoardRoleGroup, string>

const API_TO_DOMAIN_ROLE = {
  [BoardMemberResponseRole.BOARD_CHAIR_PRESIDENT]: 'board_chair_president',
  [BoardMemberResponseRole.FIDUCIARY_BOARD_MEMBER]: 'fiduciary_board_member',
  [BoardMemberResponseRole.BOARD_CHAIR]: 'board_chair',
} as const satisfies Record<string, BoardRoleGroup>

function toUpdateRole(roleGroup: BoardRoleGroup) {
  switch (roleGroup) {
    case 'board_chair_president':
      return BoardMemberUpdateItemRole.BOARD_CHAIR_PRESIDENT
    case 'fiduciary_board_member':
      return BoardMemberUpdateItemRole.FIDUCIARY_BOARD_MEMBER
    case 'board_chair':
      return BoardMemberUpdateItemRole.BOARD_CHAIR
  }
}

export function mapBoardMemberResponseToDomain(row: BoardMemberResponse): BoardMember {
  const role = row.role
  const roleGroup =
    role != null && role in API_TO_DOMAIN_ROLE
      ? API_TO_DOMAIN_ROLE[role as keyof typeof API_TO_DOMAIN_ROLE]
      : 'board_chair'
  return {
    id: row.id != null ? String(row.id) : '',
    roleGroup,
    sortOrder: row.displayOrder ?? 0,
    isPublic: Boolean(row.published),
    nameKo: row.koreanName ?? '',
    nameEn: row.englishName ?? '',
    position: row.positionTitle ?? '',
    affiliation: row.affiliationTitle ?? '',
    version: row.version ?? 0,
  }
}

export function toBoardMemberCreateRequest(
  input: BoardMemberCreateInput,
): BoardMemberCreateRequest {
  return {
    role: DOMAIN_TO_API_ROLE[input.roleGroup],
    koreanName: input.nameKo.trim(),
    englishName: input.nameEn.trim() || undefined,
    positionTitle: input.position.trim() || undefined,
    affiliationTitle: input.affiliation.trim() || undefined,
  }
}

export function toBoardMemberBulkUpdateRequest(
  rows: BoardMember[],
): BoardMemberBulkUpdateRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      role: toUpdateRole(row.roleGroup),
      koreanName: row.nameKo.trim(),
      englishName: row.nameEn.trim() || undefined,
      positionTitle: row.position.trim() || undefined,
      affiliationTitle: row.affiliation.trim() || undefined,
      displayOrder: row.sortOrder,
      version: row.version,
    })),
  }
}

/**
 * BE JaKoreaDtos.ToggleRequest는 `published` 필드.
 * Orval ToggleRequest는 `enabled`로 생성되어 있어 PublishedToggleRequest로 전송한다.
 */
export function toPublishedToggleRequest(
  published: boolean,
  version: number,
): ToggleRequest {
  const body: PublishedToggleRequest = { published, version }
  return body as unknown as ToggleRequest
}

export function toBulkDeleteRequest(
  rows: Array<{ id: string; version: number }>,
): BulkDeleteRequest {
  return {
    items: rows.map(row => ({
      id: Number(row.id),
      version: row.version,
    })),
  }
}
