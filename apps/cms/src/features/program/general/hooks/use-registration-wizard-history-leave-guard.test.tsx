/** @vitest-environment jsdom */
import { act, cleanup, render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useRegistrationWizardHistoryLeaveGuard } from './use-registration-wizard-history-leave-guard'

afterEach(() => {
  cleanup()
})

function Guarded({ enabled, requestLeave }: { enabled: boolean; requestLeave: () => void }) {
  useRegistrationWizardHistoryLeaveGuard(enabled, requestLeave)
  return null
}

function mount(enabled: boolean, entries: string[]) {
  const requestLeave = vi.fn()
  const router = createMemoryRouter(
    [{ path: '/programs/general', element: <Guarded enabled={enabled} requestLeave={requestLeave} /> }],
    { initialEntries: entries, initialIndex: entries.length - 1 }
  )
  render(<RouterProvider router={router} />)
  return { router, requestLeave }
}

const LIST = '/programs/general'
const WIZARD = '/programs/general?new=1&registrationDraft=fresh&generalStep=recruit-volunteer'

describe('useRegistrationWizardHistoryLeaveGuard', () => {
  it('작성 중 뒤로 가기는 막고 작성 취소 안내(requestLeave)를 연다', async () => {
    const { router, requestLeave } = mount(true, [LIST, WIZARD])
    await act(async () => {
      await router.navigate(-1)
    })
    expect(requestLeave).toHaveBeenCalledTimes(1)
    expect(router.state.location.search).toContain('generalStep=recruit-volunteer')
  })

  it('위저드 안 미리보기 pop(generalStep 유지)은 막지 않는다', async () => {
    const { router, requestLeave } = mount(true, [
      '/programs/general?new=1&generalStep=program',
      '/programs/general?new=1&generalStep=program&userPreview=1',
    ])
    await act(async () => {
      await router.navigate(-1)
    })
    expect(requestLeave).not.toHaveBeenCalled()
    expect(router.state.location.search).not.toContain('userPreview')
  })

  it('비활성(1사1교 등)이면 기존처럼 뒤로 간다', async () => {
    const { router, requestLeave } = mount(false, [LIST, WIZARD])
    await act(async () => {
      await router.navigate(-1)
    })
    expect(requestLeave).not.toHaveBeenCalled()
    expect(router.state.location.search).toBe('')
  })
})
