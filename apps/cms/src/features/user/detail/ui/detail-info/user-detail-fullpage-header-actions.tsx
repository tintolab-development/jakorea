import type { Dispatch, SetStateAction } from 'react'
import type { User } from '@/types/user'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  programsHistoryHasChildMenu,
  type TabState,
} from '../../lib/user-detail-fullpage-helpers'

export type UserDetailPermissionRole = 'instructor' | 'admin'

export interface UserDetailFullPageHeaderActionsProps {
  mode: 'default' | 'permission'
  permissionRole: UserDetailPermissionRole | undefined
  displayUser: Omit<User, 'password'>
  tabState: TabState
  personalInfoRevealed: boolean
  setPersonalInfoRevealed: Dispatch<SetStateAction<boolean>>
  onPermissionApprove?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  onPermissionReject?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  onWithdraw?: (user: Omit<User, 'password'>) => void
  onEdit?: (user: Omit<User, 'password'>) => void
  onOpenWithdrawConfirm: () => void
}

export function UserDetailFullPageHeaderActions({
  mode,
  permissionRole,
  displayUser,
  tabState,
  personalInfoRevealed,
  setPersonalInfoRevealed,
  onPermissionApprove,
  onPermissionReject,
  onWithdraw,
  onEdit,
  onOpenWithdrawConfirm,
}: UserDetailFullPageHeaderActionsProps) {
  const hasProgramsChildMenu = programsHistoryHasChildMenu(displayUser)
  const effectiveProgramsChild =
    tabState.lnb === 'history' && hasProgramsChildMenu
      ? (tabState.child ?? 'enrollment')
      : undefined

  if (mode === 'permission' && permissionRole) {
    return (
      <div className="info-section-buttons--wrapper">
        <CmsButton
          variant="delete"
          onClick={() => {
            onPermissionReject?.({ userId: displayUser.id, permissionRole })
          }}
        >
          신청 반려
        </CmsButton>
        <CmsButton
          onClick={() => {
            onPermissionApprove?.({ userId: displayUser.id, permissionRole })
          }}
        >
          신청 승인
        </CmsButton>
        <CmsButton
          variant={personalInfoRevealed ? 'default' : 'primary'}
          width={180}
          onClick={() => {
            if (personalInfoRevealed) {
              setPersonalInfoRevealed(false)
            } else {
              window.alert('준비 중입니다.')
            }
          }}
        >
          {personalInfoRevealed ? '개인정보 마스킹' : '개인정보 상세보기'}
        </CmsButton>
      </div>
    )
  }

  if (tabState.lnb === 'payment-status') return null

  if (tabState.lnb === 'history' && effectiveProgramsChild === 'volunteer') {
    return null
  }

  if (
    displayUser.role === 'INDIVIDUAL' &&
    tabState.lnb === 'history' &&
    effectiveProgramsChild === 'enrollment'
  ) {
    return null
  }

  if (
    displayUser.role === 'INSTRUCTOR' &&
    tabState.lnb === 'history' &&
    effectiveProgramsChild === 'lecture'
  ) {
    return null
  }

  if (displayUser.role === 'ADMIN' && tabState.lnb === 'history') {
    return null
  }

  if (displayUser.role === 'SCHOOL') {
    if (!onWithdraw) return null
    return (
      <div className="info-section-buttons--wrapper">
        {' '}
        <CmsButton
          variant="delete"
          onClick={() => {
            window.alert('준비 중입니다.')
            // TODO: 기능 연결 예정 — 학교 삭제 확인 모달
            // onOpenWithdrawConfirm()
          }}
        >
          학교 삭제
        </CmsButton>
      </div>
    )
  }

  return (
    <div className="info-section-buttons--wrapper">
      {onWithdraw ? (
        <CmsButton variant="default" onClick={onOpenWithdrawConfirm}>
          회원 탈퇴
        </CmsButton>
      ) : null}
      {onEdit ? (
        <CmsButton variant="default" onClick={() => onEdit(displayUser)}>
          정보 수정
        </CmsButton>
      ) : null}
      <CmsButton
        variant={personalInfoRevealed ? 'default' : 'primary'}
        width={180}
        onClick={() => {
          if (personalInfoRevealed) {
            setPersonalInfoRevealed(false)
          } else {
            window.alert('준비 중입니다.')
          }
        }}
      >
        {personalInfoRevealed ? '개인정보 마스킹' : '개인정보 상세보기'}
      </CmsButton>
    </div>
  )
}
