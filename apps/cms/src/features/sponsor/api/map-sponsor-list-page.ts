import {
  DATA_MANAGEMENT_LIST_PAGE_SIZE,
  type DataManagementListPage,
} from '@/features/data-management/api/data-management-list-page'
import { mapPostsListPage } from '@/features/posts/api/shared/map-posts-list-page'
import { mapSponsorResponse } from '@/features/sponsor/api/adapters/sponsor-adapters'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import type { SponsorResponse } from '@/shared/api/generated/data-management/schemas'

export function mapSponsorListPage(payload: unknown): DataManagementListPage<SponsorManagementRow> {
  const mapped = mapPostsListPage<SponsorResponse, SponsorManagementRow>(payload, mapSponsorResponse)
  const size =
    typeof mapped.size === 'number' && mapped.size > 0
      ? mapped.size
      : DATA_MANAGEMENT_LIST_PAGE_SIZE
  return { ...mapped, size }
}
