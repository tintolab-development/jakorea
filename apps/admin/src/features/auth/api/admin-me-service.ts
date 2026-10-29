import { getJAKoreaHomepageAdminAPIMeSubset } from '@/shared/api/generated/me/me-api'
import type { AdminProfile } from '@/shared/api/generated/me/schemas/adminProfile'

export async function fetchAdminMeProfile(): Promise<AdminProfile> {
  return getJAKoreaHomepageAdminAPIMeSubset().me()
}
