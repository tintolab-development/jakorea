/**
 * CMS 버튼 — presentational SSOT는 `@jakorea/admin-ui`. 권한 가드는 이 래퍼에만 둔다.
 */

import { forwardRef } from 'react'
import type { MouseEvent } from 'react'
import {
  AdminButton,
  resolveAdminButtonSize,
  resolveAdminButtonVariant,
  type AdminButtonProps,
  type AdminButtonResolvedSize,
  type AdminButtonResolvedVariant,
  type AdminButtonSize,
  type AdminButtonVariant,
} from '@jakorea/admin-ui/button'
import { guardAdminAction, type AdminActionKind } from '@/shared/lib/admin-role-policy'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'

export type CmsButtonVariant = AdminButtonVariant
export type CmsButtonSize = AdminButtonSize
export type CmsButtonResolvedSize = AdminButtonResolvedSize
export type CmsButtonResolvedVariant = AdminButtonResolvedVariant

export const resolveCmsButtonSize = resolveAdminButtonSize
export const resolveCmsButtonVariant = resolveAdminButtonVariant

export interface CmsButtonProps extends AdminButtonProps {
  adminAction?: AdminActionKind
}

export const CmsButton = forwardRef<HTMLButtonElement, CmsButtonProps>(
  ({ variant = 'primary', adminAction, onClick, loading, ...rest }, ref) => {
    const roleCode = useSessionAdminRoleCode()
    const resolvedVariant = resolveAdminButtonVariant(variant)
    const isLoading = typeof loading === 'object' ? true : Boolean(loading)
    const resolvedAdminAction = adminAction ?? (resolvedVariant === 'error' ? 'delete' : undefined)

    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      if (isLoading) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      if (resolvedAdminAction && !guardAdminAction({ roleCode, action: resolvedAdminAction })) {
        event.preventDefault()
        event.stopPropagation()
        return
      }
      onClick?.(event)
    }

    return (
      <AdminButton
        {...rest}
        ref={ref}
        variant={variant}
        loading={loading}
        onClick={handleClick} />
    )
  }
)

CmsButton.displayName = 'CmsButton'
