// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { onAdminWriteClickCapture } from './admin-role-policy'

vi.mock('@/shared/ui/cms-alert-modal-api', () => ({ cmsAlertModal: { show: vi.fn() } }))
vi.mock('@/shared/utils/post-auth-redirect', async importOriginal => {
  const actual = await importOriginal<typeof import('@/shared/utils/post-auth-redirect')>()
  return { ...actual, isAdminFirstLoginOnboardingIncomplete: () => false }
})

function clickOn(label: string, attrs: Record<string, string> = {}) {
  const button = document.createElement('button')
  button.textContent = label
  for (const [k, v] of Object.entries(attrs)) button.setAttribute(k, v)
  document.body.appendChild(button)
  const event = {
    target: button,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
  onAdminWriteClickCapture(event, 'PROGRAM_VIEWER')
  button.remove()
  return event.stopPropagation.mock.calls.length > 0
}

describe('onAdminWriteClickCapture — 툴바·상세 헤더 일괄 가드', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it.each(['캘린더 뷰로 보기', '리스트 뷰로 보기', '캘린더뷰 보기', '리스트로 보기', '미리보기'])(
    'Program Viewer도 조회 버튼 「%s」은 막지 않는다',
    label => {
      expect(clickOn(label)).toBe(false)
    }
  )

  it('허용 표시(data-admin-action="allow")가 있으면 막지 않는다', () => {
    expect(clickOn('기간 설정', { 'data-admin-action': 'allow' })).toBe(false)
  })

  it.each(['선택 삭제', '신규 등록', '개인정보 상세보기'])(
    'Program Viewer의 쓰기·개인정보 버튼 「%s」은 막는다',
    label => {
      expect(clickOn(label)).toBe(true)
    }
  )
})
