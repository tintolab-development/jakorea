/** @vitest-environment jsdom */
import { act } from 'react'
import { createPortal } from 'react-dom'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const show = vi.fn()
let profile: { roleCode?: string; permissions?: string[] } | undefined

vi.mock('@/shared/ui', () => ({ cmsAlertModal: { show: (arg: unknown) => show(arg) } }))
vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: (selector: (state: { isAuthenticated: boolean; user: { id: string } }) => unknown) =>
    selector({ isAuthenticated: true, user: { id: '1' } }),
}))
vi.mock('@/features/auth/api/use-admin-me-profile', () => ({
  useAdminMeProfile: () => ({ isSuccess: profile != null, data: profile }),
}))

import { HomepageActionGuard } from './homepage-action-guard'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let container: HTMLDivElement | null = null

function render(node: React.ReactNode) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => {
    root!.render(<HomepageActionGuard>{node}</HomepageActionGuard>)
  })
}

function byText(text: string): HTMLElement {
  const el = Array.from(document.querySelectorAll<HTMLElement>('button')).find(
    button => button.textContent?.trim() === text || button.getAttribute('aria-label') === text
  )
  if (!el) throw new Error(`button not found: ${text}`)
  return el
}

describe('HomepageActionGuard', () => {
  beforeEach(() => {
    show.mockClear()
    profile = { roleCode: 'PROGRAM_VIEWER', permissions: ['HOMEPAGE_VIEW'] }
  })
  afterEach(() => {
    act(() => root?.unmount())
    container?.remove()
    document.body.innerHTML = ''
  })

  it('Program Viewer가 수정·선택 삭제·공개 스위치·신청자 첨부를 누르면 안내만 띄운다', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    const onToggle = vi.fn()
    const onAttachment = vi.fn()
    render(
      <>
        <button type="button" onClick={onEdit}>
          수정
        </button>
        {createPortal(
          <button type="button" onClick={onDelete}>
            선택 삭제
          </button>,
          document.body
        )}
        <button type="button" role="switch" aria-label="공개 여부" onClick={onToggle} />
        <button type="button" data-homepage-action="pii" onClick={onAttachment}>
          이력서.pdf
        </button>
      </>
    )
    for (const label of ['수정', '선택 삭제', '공개 여부', '이력서.pdf']) {
      act(() => byText(label).click())
    }
    expect(onEdit).not.toHaveBeenCalled()
    expect(onDelete).not.toHaveBeenCalled()
    expect(onToggle).not.toHaveBeenCalled()
    expect(onAttachment).not.toHaveBeenCalled()
    expect(show).toHaveBeenCalledTimes(4)
    expect(byText('수정').hasAttribute('disabled')).toBe(false)
  })

  it('조회·검색 버튼과 탭 이동은 막지 않는다', () => {
    const onSearch = vi.fn()
    const onTab = vi.fn()
    render(
      <>
        <button type="button" onClick={onSearch}>
          조회
        </button>
        <button type="button" role="tab" onClick={onTab}>
          교재 등록
        </button>
      </>
    )
    act(() => byText('조회').click())
    act(() => byText('교재 등록').click())
    expect(onSearch).toHaveBeenCalledTimes(1)
    expect(onTab).toHaveBeenCalledTimes(1)
    expect(show).not.toHaveBeenCalled()
  })

  it('편집 권한이 있으면 그대로 동작한다', () => {
    profile = { roleCode: 'PROGRAM_MANAGER', permissions: ['HOMEPAGE_VIEW', 'HOMEPAGE_EDIT'] }
    const onSave = vi.fn()
    render(
      <button type="button" onClick={onSave}>
        저장
      </button>
    )
    act(() => byText('저장').click())
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(show).not.toHaveBeenCalled()
  })

  it('Program Viewer는 드래그 순서 변경 핸들의 드래그 시작을 막는다', () => {
    const onPointerDown = vi.fn()
    render(
      <button type="button" className="sort-order-drag-handle" aria-label="순서 변경" onPointerDown={onPointerDown} />
    )
    act(() => {
      byText('순서 변경').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    })
    expect(onPointerDown).not.toHaveBeenCalled()
    act(() => byText('순서 변경').click())
    expect(show).toHaveBeenCalledTimes(1)
  })
})
