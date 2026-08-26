import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getSponsorContacts } from '@/features/sponsor/api/admin-sponsors-service'
import {
  contactsParamsFromFilters,
  EMPTY_CONTACT_LIST_FILTERS,
  EMPTY_CONTACTS_PARAMS_KEY,
  matchesContactFilter,
  serializeContactsParams,
  type ContactListFilters,
} from '@/features/sponsor/api/contacts-filter-params'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { useDataManagementRemoteEnabled } from '@/features/data-management/hooks/use-data-management-remote-enabled'
import type { SponsorContactRow } from '@/features/sponsor/model/sponsor-management.types'

export type UseContactsListReturn = {
  pendingFilters: ContactListFilters
  filteredRows: SponsorContactRow[]
  allContacts: SponsorContactRow[]
  isLoading: boolean
  handleFilterChange: (key: string, value: unknown) => void
  handleSearch: () => void
}

/**
 * 후원사 상세 — 담당자 정보 서버 필터. 조회 시 GET /contacts 에 department·position·name 전달.
 */
export function useContactsList(
  sponsorId: string,
  fallbackContacts: SponsorContactRow[],
  enabled = true
): UseContactsListReturn {
  const [pendingFilters, setPendingFilters] = useState<ContactListFilters>(EMPTY_CONTACT_LIST_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState<ContactListFilters>(EMPTY_CONTACT_LIST_FILTERS)

  const params = useMemo(() => contactsParamsFromFilters(appliedFilters), [appliedFilters])
  const paramsKey = useMemo(() => serializeContactsParams(params), [params])
  const isUnfiltered = paramsKey === EMPTY_CONTACTS_PARAMS_KEY
  const remoteEnabled = useDataManagementRemoteEnabled('sponsors', enabled && Boolean(sponsorId))

  const allQuery = useQuery({
    queryKey: dataManagementQueryKeys.sponsors.contacts(sponsorId, EMPTY_CONTACTS_PARAMS_KEY),
    queryFn: () => getSponsorContacts(sponsorId),
    enabled: remoteEnabled && Boolean(sponsorId),
    staleTime: 30_000,
    retry: false,
  })

  const filteredQuery = useQuery({
    queryKey: dataManagementQueryKeys.sponsors.contacts(sponsorId, paramsKey),
    queryFn: () => getSponsorContacts(sponsorId, params),
    enabled: remoteEnabled && Boolean(sponsorId) && !isUnfiltered,
    staleTime: 30_000,
    retry: false,
  })

  const allContacts = useMemo((): SponsorContactRow[] => {
    if (!remoteEnabled) return fallbackContacts
    if (allQuery.data) return allQuery.data
    if (allQuery.isError) return []
    return fallbackContacts
  }, [allQuery.data, allQuery.isError, fallbackContacts, remoteEnabled])

  const filteredRows = useMemo((): SponsorContactRow[] => {
    if (!remoteEnabled) {
      return fallbackContacts.filter(row => matchesContactFilter(row, appliedFilters))
    }
    const items = isUnfiltered ? allContacts : (filteredQuery.data ?? [])
    if (!isUnfiltered && filteredQuery.isError) return []
    return items.filter(row => matchesContactFilter(row, appliedFilters))
  }, [
    allContacts,
    appliedFilters,
    fallbackContacts,
    filteredQuery.data,
    filteredQuery.isError,
    isUnfiltered,
    remoteEnabled,
  ])

  const handleFilterChange = useCallback((key: string, value: unknown): void => {
    setPendingFilters(prev => ({ ...prev, [key]: String(value ?? '') }))
  }, [])

  const handleSearch = useCallback((): void => {
    setAppliedFilters(pendingFilters)
  }, [pendingFilters])

  return {
    pendingFilters,
    filteredRows,
    allContacts,
    isLoading: isUnfiltered ? allQuery.isLoading : filteredQuery.isLoading,
    handleFilterChange,
    handleSearch,
  }
}
