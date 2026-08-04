import type { UserRole } from '@/types/user'

export type UserBasicInfoEntrySource = 'all_users' | 'institution' | 'instructor' | 'admin'

export const USER_BASIC_INFO_ENTRY_QUERY_KEY = 'userDetailEntry' as const

const VALID_ENTRY_SOURCES: readonly UserBasicInfoEntrySource[] = [
  'all_users',
  'institution',
  'instructor',
  'admin',
] as const

export function parseUserBasicInfoEntryQuery(
  value: string | null
): UserBasicInfoEntrySource | undefined {
  if (!value) return undefined
  return VALID_ENTRY_SOURCES.includes(value as UserBasicInfoEntrySource)
    ? (value as UserBasicInfoEntrySource)
    : undefined
}

export function resolveUserBasicInfoBodyKey(
  entrySourceProp: UserBasicInfoEntrySource | undefined,
  entryFromQuery: UserBasicInfoEntrySource | undefined,
  role: UserRole
): UserBasicInfoEntrySource {
  if (entrySourceProp) return entrySourceProp
  if (entryFromQuery) return entryFromQuery
  if (role === 'SCHOOL') return 'institution'
  if (role === 'INSTRUCTOR') return 'instructor'
  if (role === 'ADMIN') return 'admin'
  return 'all_users'
}
