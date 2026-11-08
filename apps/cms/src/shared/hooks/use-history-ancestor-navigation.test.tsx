/** @vitest-environment jsdom */
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Outlet, RouterProvider, createBrowserRouter } from 'react-router-dom'
import {
  readHistoryIdx,
  recordRouterHistory,
  resetHistoryEntriesForTest,
} from '@/shared/lib/history-ancestor-navigation'
import { useNavigateToAncestor } from './use-history-ancestor-navigation'

type Api = ReturnType<typeof useNavigateToAncestor>

function setup(initialUrl: string) {
  window.history.replaceState(null, '', initialUrl)
  const apiRef: { current: Api | null } = { current: null }
  function Root() {
    const api = useNavigateToAncestor()
    useEffect(() => {
      apiRef.current = api
    })
    return <Outlet />
  }
  const router = createBrowserRouter([
    { path: '/', element: <Root />, children: [{ path: 'programs', element: null }] },
  ])
  const unsubscribe = recordRouterHistory(router)
  render(<RouterProvider router={router} />)
  return { router, unsubscribe, api: () => apiRef.current! }
}

function currentUrl() {
  return `${window.location.pathname}${window.location.search}`
}

describe('useNavigateToAncestor — 풀페이지 상세 스택과 브라우저 history', () => {
  beforeEach(() => {
    resetHistoryEntriesForTest()
  })
  afterEach(() => {
    cleanup()
  })

  it('목록 → 상세 → LNB → 신청자 상세에서 신청자 닫기는 한 단계 뒤로, 모달 닫기는 목록 엔트리로 돌아간다', async () => {
    const { router, api } = setup('/programs?page=2')
    await act(async () => {
      await router.navigate('/programs?page=2&programId=1&lnb=info')
      await router.navigate('/programs?page=2&programId=1&lnb=applicants')
      await router.navigate('/programs?page=2&programId=1&lnb=applicants&applicantId=9')
    })
    expect(readHistoryIdx()).toBe(3)

    // 신청자 상세 닫기(X·브레드크럼) → push가 아니라 직전 엔트리로
    act(() => {
      api().toSearch(current => {
        const next = new URLSearchParams(current)
        next.delete('applicantId')
        return next
      })
    })
    await waitFor(() => expect(readHistoryIdx()).toBe(2))
    expect(currentUrl()).toBe('/programs?page=2&programId=1&lnb=applicants')

    // 모달 닫기 → 목록 엔트리(idx 0)로, 상세 엔트리를 앞쪽에 남기지 않음
    act(() => {
      api().toTarget({ pathname: '/programs', search: '?page=2' })
    })
    await waitFor(() => expect(readHistoryIdx()).toBe(0))
    expect(currentUrl()).toBe('/programs?page=2')
  })

  it('딥링크로 바로 들어온 중첩 상세는 닫을 때 replace (새 엔트리를 만들지 않음)', async () => {
    const { api } = setup('/programs?programId=1&lnb=applicants&applicantId=9')
    const idxBefore = readHistoryIdx()
    act(() => {
      api().toSearch(current => {
        const next = new URLSearchParams(current)
        next.delete('applicantId')
        return next
      })
    })
    await waitFor(() => expect(currentUrl()).toBe('/programs?lnb=applicants&programId=1'))
    expect(readHistoryIdx()).toBe(idxBefore)
  })
})
