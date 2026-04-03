import type { Dispatch, SetStateAction } from 'react'
import type { User } from '@/types/user'
import { AppButton } from '@/shared/ui/app-button'
import type { UserDetailLnbKey, UserDetailProgramsChildKey } from './user-detail-fullpage-helpers'

export type UserDetailPermissionRole = 'instructor' | 'admin'

export interface UserDetailFullPageHeaderActionsProps {
  mode: 'default' | 'permission'
  permissionRole: UserDetailPermissionRole | undefined
  displayUser: Omit<User, 'password'>
  activeLnb: UserDetailLnbKey
  activeProgramsChild: UserDetailProgramsChildKey
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
  activeLnb,
  activeProgramsChild,
  personalInfoRevealed,
  setPersonalInfoRevealed,
  onPermissionApprove,
  onPermissionReject,
  onWithdraw,
  onEdit,
  onOpenWithdrawConfirm,
}: UserDetailFullPageHeaderActionsProps) {
  if (mode === 'permission' && permissionRole) {
    return (
      <div className="user-detail-fullpage-modal__header-actions">
        <AppButton
          variant="danger"
          size="filter"
          dangerFillOnHover
          onClick={() => {
            onPermissionReject?.({ userId: displayUser.id, permissionRole })
          }}
          className="user-detail-modal__btn-withdraw"
        >
          신청 반려
        </AppButton>
        <AppButton
          variant="cancel"
          size="filter"
          onClick={() => {
            onPermissionApprove?.({ userId: displayUser.id, permissionRole })
          }}
          className="user-detail-modal__btn-edit"
        >
          신청 승인
        </AppButton>
        <AppButton
          variant={personalInfoRevealed ? 'default' : 'primary'}
          size="filter-wide"
          onClick={() => {
            if (personalInfoRevealed) {
              setPersonalInfoRevealed(false)
            } else {
              window.alert('준비 중입니다.')
            }
          }}
        >
          {personalInfoRevealed ? '개인정보 마스킹' : '개인정보 상세보기'}
        </AppButton>
      </div>
    )
  }

  if (activeLnb === 'payment-status') return null

  if (activeLnb === 'history' && activeProgramsChild === 'volunteer') {
    return null
  }

  if (
    displayUser.role === 'INDIVIDUAL' &&
    activeLnb === 'history' &&
    activeProgramsChild === 'enrollment'
  ) {
    return null
  }

  if (
    displayUser.role === 'INSTRUCTOR' &&
    activeLnb === 'history' &&
    activeProgramsChild === 'lecture'
  ) {
    return null
  }

  if (displayUser.role === 'ADMIN' && activeLnb === 'history') {
    return null
  }

  if (displayUser.role === 'SCHOOL') {
    if (!onWithdraw) return null
    return (
      <div className="user-detail-fullpage-modal__header-actions">
        <AppButton
          variant="danger"
          size="filter"
          dangerFillOnHover
          onClick={onOpenWithdrawConfirm}
          className="user-detail-modal__btn-withdraw"
        >
          학교 삭제
        </AppButton>
      </div>
    )
  }

  return (
    <div className="user-detail-fullpage-modal__header-actions">
      {onWithdraw ? (
        <AppButton
          variant="default"
          size="filter"
          onClick={onOpenWithdrawConfirm}
          className="user-detail-modal__btn-withdraw"
        >
          회원 탈퇴
        </AppButton>
      ) : null}
      {onEdit ? (
        <AppButton
          variant="default"
          size="filter"
          onClick={() => onEdit(displayUser)}
          className="user-detail-modal__btn-edit"
        >
          정보 수정
        </AppButton>
      ) : null}
      <AppButton
        variant={personalInfoRevealed ? 'default' : 'primary'}
        size="filter-wide"
        onClick={() => {
          if (personalInfoRevealed) {
            setPersonalInfoRevealed(false)
          } else {
            window.alert('준비 중입니다.')
          }
        }}
      >
        {personalInfoRevealed ? '개인정보 마스킹' : '개인정보 상세보기'}
      </AppButton>
    </div>
  )
}
