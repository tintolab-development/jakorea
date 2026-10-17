/** CMS·관리자가 작성한 프로그램 안내사항 작성자 표시 */
export const PORTAL_CMS_STAFF_AUTHOR_LABEL = 'JA Korea 담당자'

/** `createdByDisplayName` null·빈 값(탈퇴·삭제·미존재 등) */
export const PORTAL_NOTICE_UNKNOWN_AUTHOR_LABEL = '작성자 정보 없음'

export type PortalNoticeAuthorSource = {
  createdByDisplayName?: string | null
  createdByActorType?: string
  mine?: boolean
}

export function isPortalCmsStaffActorType(actorType?: string): boolean {
  const normalized = (actorType ?? '').trim().toUpperCase()
  return normalized === 'ADMIN' || normalized === 'CMS' || normalized === 'SYSTEM'
}

export function mapPortalNoticePostAuthor(
  displayName: string | null | undefined,
  actorType?: string,
): { authorName: string; authorIsStaff: boolean } {
  const named = displayName?.trim()
  if (isPortalCmsStaffActorType(actorType)) {
    if (named) {
      return { authorName: named, authorIsStaff: true }
    }
    return { authorName: PORTAL_CMS_STAFF_AUTHOR_LABEL, authorIsStaff: true }
  }
  if (named) {
    return { authorName: named, authorIsStaff: false }
  }
  return { authorName: PORTAL_NOTICE_UNKNOWN_AUTHOR_LABEL, authorIsStaff: false }
}

/** 목록·상세 동일 규칙 — OpenAPI `MemberPortalNoticeListItem` / `MemberPortalNoticeDetailResponse` */
export function mapPortalNoticeAuthorFields(source: PortalNoticeAuthorSource): {
  authorName: string
  authorIsStaff: boolean
  isAuthor: boolean
} {
  const author = mapPortalNoticePostAuthor(
    source.createdByDisplayName,
    source.createdByActorType,
  )
  return {
    authorName: author.authorName,
    authorIsStaff: author.authorIsStaff,
    isAuthor: source.mine === true,
  }
}

/** 댓글·반응 등 actor 표시 — `authorDisplayName` 우선, 관리자 actor 는 담당자 라벨 */
export function portalEducationNoticeActorLabel(
  displayName: string | null | undefined,
  actorType: string | undefined,
  mine: boolean | undefined,
): string {
  const named = displayName?.trim()
  if (named) return named
  if (isPortalCmsStaffActorType(actorType)) {
    return PORTAL_CMS_STAFF_AUTHOR_LABEL
  }
  if (mine) return '나'
  return PORTAL_NOTICE_UNKNOWN_AUTHOR_LABEL
}
