import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import {
  EMPTY_CONTACTS_PARAMS_KEY,
  serializeContactsParams,
} from '@/features/sponsor/api/contacts-filter-params'
import {
  applyCreatedContactToDetail,
  applyDeletedContactsToDetail,
  applyUpdatedContactToDetail,
  mergeCreatedContact,
} from './contact-query-cache'
import type {
  SponsorContactRow,
  SponsorManagementDetailView,
} from '@/features/sponsor/model/sponsor-management.types'

function contact(
  partial: Partial<SponsorContactRow> & Pick<SponsorContactRow, 'id' | 'contactType'>
): SponsorContactRow {
  return {
    name: partial.name ?? partial.id,
    department: '',
    position: '',
    officePhone: '',
    phone: '',
    email: '',
    companyAddress: '',
    memo: '',
    registeredAt: '',
    ...partial,
  }
}

function detail(contacts: SponsorContactRow[]): SponsorManagementDetailView {
  return {
    id: 'sp-1',
    name: '테스트',
    createdAt: '',
    updatedAt: '',
    programCount: 0,
    totalDonationAmount: 0,
    totalBeneficiaryCount: 0,
    nameDisplayKo: '테스트',
    nameDisplayEn: '',
    businessNumber: '',
    executives: '',
    address: '',
    homepageUrl: '',
    logos: [],
    contacts,
    programHistories: [],
    yearlyBusinesses: [],
  }
}

describe('mergeCreatedContact', () => {
  it('prepends the created contact and keeps a single lead', () => {
    const existing = [contact({ id: 'c1', contactType: 'lead', name: '기존' })]
    const created = contact({ id: 'c2', contactType: 'lead', name: '신규' })

    expect(mergeCreatedContact(existing, created)).toEqual([
      contact({ id: 'c2', contactType: 'lead', name: '신규' }),
      contact({ id: 'c1', contactType: 'assistant', name: '기존' }),
    ])
  })
})

describe('applyCreatedContactToDetail', () => {
  it('patches the cached detail contacts immediately', () => {
    const queryClient = new QueryClient()
    const key = dataManagementQueryKeys.sponsors.detail('sp-1')
    queryClient.setQueryData(key, detail([contact({ id: 'c1', contactType: 'lead' })]))

    applyCreatedContactToDetail(
      queryClient,
      'sp-1',
      contact({ id: 'c2', contactType: 'assistant', name: '신규' })
    )

    expect(queryClient.getQueryData<SponsorManagementDetailView>(key)?.contacts.map(row => row.id)).toEqual([
      'c2',
      'c1',
    ])
  })
})

describe('applyUpdatedContactToDetail', () => {
  it('promotes the updated row to the only lead', () => {
    const queryClient = new QueryClient()
    const key = dataManagementQueryKeys.sponsors.detail('sp-1')
    queryClient.setQueryData(
      key,
      detail([
        contact({ id: 'c1', contactType: 'lead' }),
        contact({ id: 'c2', contactType: 'assistant' }),
      ])
    )

    applyUpdatedContactToDetail(
      queryClient,
      'sp-1',
      contact({ id: 'c2', contactType: 'lead' })
    )

    const contacts = queryClient.getQueryData<SponsorManagementDetailView>(key)?.contacts ?? []
    expect(contacts.find(row => row.id === 'c2')?.contactType).toBe('lead')
    expect(contacts.find(row => row.id === 'c1')?.contactType).toBe('assistant')
  })
})

describe('applyDeletedContactsToDetail', () => {
  it('removes ids and promotes the remaining first row to lead', () => {
    const queryClient = new QueryClient()
    const key = dataManagementQueryKeys.sponsors.detail('sp-1')
    queryClient.setQueryData(
      key,
      detail([
        contact({ id: 'c1', contactType: 'lead' }),
        contact({ id: 'c2', contactType: 'assistant' }),
      ])
    )

    applyDeletedContactsToDetail(queryClient, 'sp-1', ['c1'])

    expect(queryClient.getQueryData<SponsorManagementDetailView>(key)?.contacts).toEqual([
      contact({ id: 'c2', contactType: 'lead' }),
    ])
  })
})

describe('applyUpdatedContactToDetail list cache', () => {
  it('patches GET /contacts caches including filtered keys', () => {
    const queryClient = new QueryClient()
    const allKey = dataManagementQueryKeys.sponsors.contacts('sp-1', EMPTY_CONTACTS_PARAMS_KEY)
    const filteredKey = dataManagementQueryKeys.sponsors.contacts(
      'sp-1',
      serializeContactsParams({ department: '기획' })
    )
    queryClient.setQueryData(allKey, [
      contact({ id: 'c1', contactType: 'lead', department: '기획' }),
      contact({ id: 'c2', contactType: 'assistant', department: '영업' }),
    ])
    queryClient.setQueryData(filteredKey, [
      contact({ id: 'c1', contactType: 'lead', department: '기획' }),
    ])

    applyUpdatedContactToDetail(
      queryClient,
      'sp-1',
      contact({ id: 'c2', contactType: 'lead', department: '영업' })
    )

    const all = queryClient.getQueryData<SponsorContactRow[]>(allKey) ?? []
    expect(all.find(row => row.id === 'c2')?.contactType).toBe('lead')
    expect(all.find(row => row.id === 'c1')?.contactType).toBe('assistant')
    expect(queryClient.getQueryData<SponsorContactRow[]>(filteredKey)?.map(row => row.id)).toEqual([
      'c1',
    ])
  })
})
