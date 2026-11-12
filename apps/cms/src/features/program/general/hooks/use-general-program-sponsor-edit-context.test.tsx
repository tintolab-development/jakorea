// @vitest-environment jsdom
/**
 * 프로그램 공통 정보 수정 — 후원사 담당자 선택지는 contactPrivacy=MASKED, 데이터 관리(RAW) 캐시와 키 분리
 */
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { dataManagementQueryKeys } from '@/features/data-management/api/data-management-query-keys'
import { EMPTY_CONTACTS_PARAMS_KEY } from '@/features/sponsor/api/contacts-filter-params'
import {
  programSponsorMaskedQueryKeys,
  useGeneralProgramSponsorEditContext,
  useProgramSponsorContactsMaskedQuery,
} from './use-general-program-sponsor-edit-context'

const getSponsorContacts = vi.fn()
const getSponsorDetail = vi.fn()

vi.mock('@/features/sponsor/api/admin-sponsors-service', () => ({
  getSponsorContacts: (...args: unknown[]) => getSponsorContacts(...args),
  getSponsorDetail: (...args: unknown[]) => getSponsorDetail(...args),
}))

vi.mock('@/features/data-management/hooks/use-data-management-remote-enabled', () => ({
  useDataManagementRemoteEnabled: (_module: string, enabled = true) => enabled,
}))

function wrapperFor(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const contact = {
  id: 'c1',
  name: '담당자',
  position: '책임',
  phone: '010-****-5678',
  contactType: 'lead',
}

describe('useGeneralProgramSponsorEditContext', () => {
  beforeEach(() => {
    getSponsorContacts.mockReset()
    getSponsorDetail.mockReset()
    getSponsorContacts.mockResolvedValue([contact])
  })

  it('수정 모드에서 contactPrivacy=MASKED로 조회하고 RAW 캐시 키를 쓰지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => useGeneralProgramSponsorEditContext(['11'], true, { sponsorRows: [] }),
      { wrapper: wrapperFor(queryClient) }
    )
    await waitFor(() => expect(result.current.contactsBySponsorId['11']).toHaveLength(1))
    expect(getSponsorContacts).toHaveBeenCalledWith('11', { contactPrivacy: 'MASKED' })
    expect(getSponsorDetail).not.toHaveBeenCalled()
    expect(
      queryClient.getQueryState(programSponsorMaskedQueryKeys.contacts('11'))
    ).toBeDefined()
    expect(
      queryClient.getQueryState(
        dataManagementQueryKeys.sponsors.contacts('11', EMPTY_CONTACTS_PARAMS_KEY)
      )
    ).toBeUndefined()
  })

  it('조회 모드(catalogEnabled=false)에서는 담당자 API를 부르지 않는다', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(
      () => useGeneralProgramSponsorEditContext(['11'], false, { sponsorRows: [] }),
      { wrapper: wrapperFor(queryClient) }
    )
    await Promise.resolve()
    expect(getSponsorContacts).not.toHaveBeenCalled()
    expect(result.current.contactsBySponsorId).toEqual({})
  })

  it('후원사 행을 주지 않으면 상세도 contactPrivacy=MASKED로 조회한다', async () => {
    getSponsorDetail.mockResolvedValue({ id: '11', name: '후원사', logos: [], contacts: [] })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useGeneralProgramSponsorEditContext(['11'], true), {
      wrapper: wrapperFor(queryClient),
    })
    await waitFor(() => expect(result.current.sponsors).toHaveLength(1))
    expect(getSponsorDetail).toHaveBeenCalledWith('11', { contactPrivacy: 'MASKED' })
    expect(queryClient.getQueryState(dataManagementQueryKeys.sponsors.detail('11'))).toBeUndefined()
  })
})

describe('useProgramSponsorContactsMaskedQuery', () => {
  it('단일 후원사 선택지도 MASKED로 조회한다', async () => {
    getSponsorContacts.mockReset()
    getSponsorContacts.mockResolvedValue([contact])
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = renderHook(() => useProgramSponsorContactsMaskedQuery('22', true), {
      wrapper: wrapperFor(queryClient),
    })
    await waitFor(() => expect(result.current.data).toHaveLength(1))
    expect(getSponsorContacts).toHaveBeenCalledWith('22', { contactPrivacy: 'MASKED' })
  })
})
