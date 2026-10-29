/**
 * Admin 버튼 — presentational SSOT는 `@jakorea/admin-ui`. 기존 size/variant alias를 보존한다.
 */

import { forwardRef } from 'react'
import {
  AdminButton,
  ADMIN_ACTION_BUTTON_WIDTH,
  ADMIN_CERTIFICATE_ISSUE_BUTTON_WIDTH,
  type AdminButtonProps,
} from '@jakorea/admin-ui/button'

export type CmsButtonVariant = 'primary' | 'secondary' | 'default' | 'delete'
export type CmsButtonSize = 'large' | 'medium' | 'small'

export const CMS_ACTION_BUTTON_WIDTH = ADMIN_ACTION_BUTTON_WIDTH
export const CMS_CERTIFICATE_ISSUE_BUTTON_WIDTH = ADMIN_CERTIFICATE_ISSUE_BUTTON_WIDTH

export interface CmsButtonProps extends Omit<AdminButtonProps, 'variant' | 'size'> {
  variant?: CmsButtonVariant
  size?: CmsButtonSize
}

export const CmsButton = forwardRef<HTMLButtonElement, CmsButtonProps>(
  ({ variant = 'primary', size = 'large', ...rest }, ref) => {
    return <AdminButton ref={ref} variant={variant} size={size} {...rest} />
  }
)

CmsButton.displayName = 'CmsButton'
