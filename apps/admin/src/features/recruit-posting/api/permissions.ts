/**
 * 채용공고 공개 토글은 EDIT와 PUBLISH가 모두 있을 때만 연다.
 */

import { getJAKoreaHomepageAdminAPIMeSubset } from '@/shared/api/generated/me/me-api'

const EDIT_PERMISSION = 'HOMEPAGE_EDIT'
const PUBLISH_PERMISSION = 'HOMEPAGE_PUBLISH'

export async function canToggleRecruitPostingVisibility(): Promise<boolean> {
  const profile = await getJAKoreaHomepageAdminAPIMeSubset().me()
  const permissions = profile.permissions ?? []
  return permissions.includes(EDIT_PERMISSION) && permissions.includes(PUBLISH_PERMISSION)
}
