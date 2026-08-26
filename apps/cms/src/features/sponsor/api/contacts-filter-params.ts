import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'
import type { SponsorContactsQueryParams } from '@/features/sponsor/api/sponsors-api-client'

export type ContactListFilters = {
  department: string
  position: string
  name: string
}

export const EMPTY_CONTACT_LIST_FILTERS: ContactListFilters = {
  department: '',
  position: '',
  name: '',
}

export function contactsParamsFromFilters(
  filters: ContactListFilters
): SponsorContactsQueryParams {
  const params: SponsorContactsQueryParams = {}
  const department = filters.department.trim()
  const position = filters.position.trim()
  const name = filters.name.trim()
  if (department) params.department = department
  if (position) params.position = position
  if (name) params.name = name
  return params
}

export function serializeContactsParams(params: SponsorContactsQueryParams): string {
  return JSON.stringify({
    department: params.department ?? '',
    position: params.position ?? '',
    name: params.name ?? '',
  })
}

export const EMPTY_CONTACTS_PARAMS_KEY = serializeContactsParams({})

/** OpenAPI ContactsParams에 필터 키 없음 — FE 확장 전송 + BE 미지원 시 클라 보조 매칭 */
export function matchesContactFilter(
  row: Pick<SponsorContactRow, 'department' | 'position' | 'name'>,
  filters: ContactListFilters
): boolean {
  const department = filters.department.trim().toLowerCase()
  const position = filters.position.trim().toLowerCase()
  const name = filters.name.trim().toLowerCase()
  if (department && !row.department.toLowerCase().includes(department)) return false
  if (position && !row.position.toLowerCase().includes(position)) return false
  if (name && !row.name.toLowerCase().includes(name)) return false
  return true
}

export function contactFiltersFromParamsKey(paramsKey: string): ContactListFilters | null {
  try {
    const parsed = JSON.parse(paramsKey) as Partial<ContactListFilters>
    return {
      department: typeof parsed.department === 'string' ? parsed.department : '',
      position: typeof parsed.position === 'string' ? parsed.position : '',
      name: typeof parsed.name === 'string' ? parsed.name : '',
    }
  } catch {
    return null
  }
}
