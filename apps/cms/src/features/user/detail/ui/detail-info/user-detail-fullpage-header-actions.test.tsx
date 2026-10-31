// @vitest-environment jsdom

import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { User } from '@/types/user'
import { UserDetailFullPageHeaderActions } from './user-detail-fullpage-header-actions'

const mockShell = {
  basicInfoEditing: false,
  basicInfoEditScope: 'profile' as const,
  basicInfoSaveLoading: false,
  basicInfoEntrySource: undefined as string | undefined,
  onStartBasicInfoEdit: vi.fn(),
  onStartAdminCommentEdit: vi.fn(),
  onCancelBasicInfoEdit: vi.fn(),
  onSaveBasicInfoEdit: vi.fn(),
  onOpenInstructorPermissionRevoke: vi.fn(),
}

vi.mock('./user-detail-fullpage-shell-context', () => ({
  useUserDetailFullpageShell: () => mockShell,
}))

vi.mock('@/features/auth/model/auth-store', () => ({
  useAuthStore: (select: (state: { user: { id: string; role: string } }) => unknown) =>
    select({ user: { id: 'admin-1', role: 'ADMIN' } }),
}))

vi.mock('@/features/user/shared/lib/admin-provisioned-member-policy', () => ({
  canAccessAdminCommentInAdminDetail: () => true,
  canStartAdminMemberProfileEdit: () => true,
  isCmsAdminUser: () => true,
  shouldShowAdminCommentSectionForViewer: () => false,
  shouldShowCmsMemberInfoEditButtonOrInstructorRestricted: () => true,
}))

vi.mock('@/features/user/api/member-remote-capabilities', () => ({
  isMemberBasicInfoPatchRemoteEnabled: () => true,
  isMembersRemoteEnabled: () => false,
}))

vi.mock('@/features/user/detail/ui/user-basic-info-section', () => ({
  parseUserBasicInfoEntryQuery: () => null,
  resolveUserBasicInfoBodyKey: () => 'instructor',
  USER_BASIC_INFO_ENTRY_QUERY_KEY: 'entry',
}))

vi.mock('@/features/user/detail/ui/personal-info-reveal-button', () => ({
  PERSONAL_INFO_REVEAL_BUTTON_LABEL: { reveal: '개인정보 상세보기', hide: '개인정보 숨기기' },
  PersonalInfoRevealButton: () => createElement('button', { type: 'button' }, '개인정보 상세보기'),
}))

afterEach(cleanup)

beforeEach(() => {
  mockShell.basicInfoEditing = false
  mockShell.basicInfoEditScope = 'profile'
  mockShell.basicInfoSaveLoading = false
  mockShell.onStartBasicInfoEdit.mockReset()
  mockShell.onCancelBasicInfoEdit.mockReset()
  mockShell.onSaveBasicInfoEdit.mockReset()
})

const instructorUser = {
  id: 'instructor-1',
  role: 'INSTRUCTOR',
  roles: ['INSTRUCTOR'],
  instructorMemberProfile: 'instructor_only',
  name: '강사 회원',
} as unknown as Omit<User, 'password'>

const memberUser = {
  id: 'member-1',
  role: 'INDIVIDUAL',
  name: '일반 회원',
} as unknown as Omit<User, 'password'>

function renderHeader(displayUser: Omit<User, 'password'>, onWithdraw = vi.fn()) {
  return render(
    <MemoryRouter>
      <UserDetailFullPageHeaderActions
        mode="default"
        permissionRole={undefined}
        displayUser={displayUser}
        tabState={{ lnb: 'detail-info' }}
        personalInfoRevealed={false}
        onRequestPersonalInfoReveal={vi.fn()}
        onWithdraw={onWithdraw}
        onOpenWithdrawConfirm={vi.fn()}
      />
    </MemoryRouter>
  )
}

describe('UserDetailFullPageHeaderActions', () => {
  it('강사 상세 조회 모드에서 강사 권한 종료를 노출한다', () => {
    renderHeader(instructorUser)

    expect(screen.getByRole('button', { name: '강사 권한 종료' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '회원 삭제' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '정보 수정' })).toBeTruthy()
  })

  it('강사 상세 수정 모드에서 강사 권한 종료를 숨기고 취소/저장만 남긴다', () => {
    mockShell.basicInfoEditing = true
    renderHeader(instructorUser)

    expect(screen.queryByRole('button', { name: '강사 권한 종료' })).toBeNull()
    expect(screen.queryByRole('button', { name: '회원 삭제' })).toBeNull()
    expect(screen.queryByRole('button', { name: '정보 수정' })).toBeNull()
    expect(screen.queryByRole('button', { name: '개인정보 상세보기' })).toBeNull()
    expect(screen.getByRole('button', { name: '취소' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '저장' })).toBeTruthy()
  })

  it('회원 상세 수정 모드에서 삭제 버튼을 숨긴다', () => {
    mockShell.basicInfoEditing = true
    renderHeader(memberUser)

    expect(screen.queryByRole('button', { name: '회원 삭제' })).toBeNull()
    expect(screen.getByRole('button', { name: '취소' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '저장' })).toBeTruthy()
  })

  it('저장 실패(로딩 종료·편집 유지) 시에도 취소/저장만 유지한다', () => {
    mockShell.basicInfoEditing = true
    mockShell.basicInfoSaveLoading = true
    renderHeader(instructorUser)

    expect(screen.getByRole('button', { name: '취소' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '저장' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '강사 권한 종료' })).toBeNull()
    expect(screen.getByRole('button', { name: '취소' })).toHaveProperty('disabled', true)
  })

  it('수정 종료 시 기존 권한별 버튼을 복구한다', () => {
    mockShell.basicInfoEditing = true
    const { rerender } = renderHeader(instructorUser)
    expect(screen.queryByRole('button', { name: '강사 권한 종료' })).toBeNull()

    mockShell.basicInfoEditing = false
    rerender(
      <MemoryRouter>
        <UserDetailFullPageHeaderActions
          mode="default"
          permissionRole={undefined}
          displayUser={instructorUser}
          tabState={{ lnb: 'detail-info' }}
          personalInfoRevealed={false}
          onRequestPersonalInfoReveal={vi.fn()}
          onWithdraw={vi.fn()}
          onOpenWithdrawConfirm={vi.fn()}
        />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: '강사 권한 종료' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '회원 삭제' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '정보 수정' })).toBeTruthy()
  })

  it('저장 클릭은 기존 저장 핸들러를 호출한다', () => {
    mockShell.basicInfoEditing = true
    renderHeader(instructorUser)
    fireEvent.click(screen.getByRole('button', { name: '저장' }))
    expect(mockShell.onSaveBasicInfoEdit).toHaveBeenCalledOnce()
  })
})
