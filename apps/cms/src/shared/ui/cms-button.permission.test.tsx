/**
 * @vitest-environment jsdom
 */
import { createElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { guardAdminAction } from '@/shared/lib/admin-role-policy'
import { CmsButton } from './cms-button'

vi.mock('@/shared/lib/admin-role-policy', () => ({
  guardAdminAction: vi.fn(() => false),
}))
vi.mock('@/shared/lib/use-session-admin-role-code', () => ({
  useSessionAdminRoleCode: () => 'VIEWER',
}))

afterEach(() => {
  cleanup()
  vi.mocked(guardAdminAction).mockClear()
})

describe('CmsButton permission wrapper', () => {
  it('delete/error 클릭에서 guardAdminAction을 호출하고 onClick을 막는다', () => {
    const onClick = vi.fn()
    const { getByRole } = render(
      createElement(CmsButton, { variant: 'delete', onClick }, '삭제')
    )
    fireEvent.click(getByRole('button', { name: '삭제' }))
    expect(guardAdminAction).toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })
})
