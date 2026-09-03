import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import {
  applySponsorStatusToCachedLists,
  applySponsorStatusToList,
  listStatusFilterFromSearchKey,
} from './apply-status-to-list'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'

function row(id: string, sponsorshipStatus: 'active' | 'ended'): SponsorManagementRow {
  return {
    id,
    name: id,
    createdAt: '',
    updatedAt: '',
    programCount: 0,
    totalDonationAmount: 0,
    totalBeneficiaryCount: 0,
    sponsorshipStatus,
  }
}

describe('listStatusFilterFromSearchKey', () => {
  it('reads sp_st from the list query key', () => {
    expect(listStatusFilterFromSearchKey('sp_st=ended')).toBe('ended')
    expect(listStatusFilterFromSearchKey('sp_name=우리&sp_st=active')).toBe('active')
    expect(listStatusFilterFromSearchKey('')).toBe('ALL')
  })
})

describe('applySponsorStatusToList', () => {
  const rows = [row('1', 'active'), row('2', 'ended')]

  it('patches the row when the list is unfiltered', () => {
    expect(applySponsorStatusToList(rows, '1', 'ended', 'ALL')).toEqual([
      row('1', 'ended'),
      row('2', 'ended'),
    ])
  })

  it('removes the row when it no longer matches the status filter', () => {
    expect(applySponsorStatusToList(rows, '1', 'ended', 'active')).toEqual([row('2', 'ended')])
  })
})

describe('applySponsorStatusToCachedLists', () => {
  it('patches every cached list using that list filter', () => {
    const queryClient = new QueryClient()
    const allKey = dataManagementQueryKeys.sponsors.list('')
    const activeKey = dataManagementQueryKeys.sponsors.list('sp_st=active')
    queryClient.setQueryData<SponsorManagementRow[]>(allKey, [
      row('1', 'active'),
      row('2', 'ended'),
    ])
    queryClient.setQueryData<SponsorManagementRow[]>(activeKey, [row('1', 'active')])

    applySponsorStatusToCachedLists(queryClient, '1', 'ended')

    expect(queryClient.getQueryData<SponsorManagementRow[]>(allKey)?.map(r => r.sponsorshipStatus)).toEqual([
      'ended',
      'ended',
    ])
    expect(queryClient.getQueryData<SponsorManagementRow[]>(activeKey)).toEqual([])
  })
})
