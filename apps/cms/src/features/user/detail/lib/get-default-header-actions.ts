import type { User } from '@/types/user'
import type { CmsButtonVariant } from '@/shared/ui/cms-button'
export type ActionConfig = {
  key: string
  label: string
  variant?: string
  onClick: () => void
}

export interface GetDefaultHeaderActionsCtx {
  viewKind: 'school_delete' | 'standard'
  displayUser: Omit<User, 'password'>
  onWithdraw?: (user: Omit<User, 'password'>) => void
  onOpenWithdrawConfirm: () => void
  onOpenInstructorPermissionRevoke: () => void
}

export function getDefaultHeaderActions(ctx: GetDefaultHeaderActionsCtx): ActionConfig[] {
  const { viewKind, displayUser, onWithdraw, onOpenWithdrawConfirm, onOpenInstructorPermissionRevoke } = ctx

  if (viewKind === 'school_delete') {
    return [
      {
        key: 'school-delete',
        label: '학교 삭제',
        variant: 'delete',
        onClick: () => {
          onOpenWithdrawConfirm()
        },
      },
    ]
  }

  const actions: ActionConfig[] = []

  if (onWithdraw) {
    actions.push({
      key: 'withdraw',
      label: '회원 탈퇴',
      variant: 'delete',
      onClick: () => {
        onOpenWithdrawConfirm()
      },
    })
  }
  if (displayUser.role === 'INSTRUCTOR') {
    actions.push({
      key: 'revoke-instructor-permission',
      label: '강사 권한 박탈',
      variant: 'delete',
      onClick: () => {
        onOpenInstructorPermissionRevoke()
      },
    })
  }

  return actions
}

export function actionConfigToCmsVariant(variant: string | undefined): CmsButtonVariant {
  if (
    variant === 'delete' ||
    variant === 'primary' ||
    variant === 'secondary' ||
    variant === 'default'
  ) {
    return variant
  }
  return 'default'
}
