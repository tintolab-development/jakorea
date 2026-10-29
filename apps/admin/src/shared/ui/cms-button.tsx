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
/** 기존 alias(large/medium/small) + CMS와 동일한 높이 토큰(h52~h32) */
export type CmsButtonSize = 'large' | 'medium' | 'small' | 'h52' | 'h44' | 'h40' | 'h36' | 'h32'

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
