/** CMS·관리자가 작성한 프로그램 안내사항 작성자 표시 */
export const PORTAL_CMS_STAFF_AUTHOR_LABEL = 'JA Korea 담당자'

export function isPortalCmsStaffActorType(actorType?: string): boolean {
  const normalized = (actorType ?? '').trim().toUpperCase()
  return normalized === 'ADMIN' || normalized === 'CMS' || normalized === 'SYSTEM'
}

export function mapPortalNoticePostAuthor(
  displayName: string | null | undefined,
  actorType?: string,
): { authorName: string; authorIsStaff: boolean } {
  if (isPortalCmsStaffActorType(actorType)) {
    return { authorName: PORTAL_CMS_STAFF_AUTHOR_LABEL, authorIsStaff: true }
  }
  const named = displayName?.trim()
  if (named) {
    return { authorName: named, authorIsStaff: false }
  }
  return { authorName: '안내', authorIsStaff: false }
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
  return '회원'
}
