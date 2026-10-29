/**
 * Admin 인풋 — SSOT는 `@jakorea/admin-ui`. 기존 size(small=32)와 allowClear 기본 false를 보존한다.
 */

import { forwardRef } from 'react'
import { AdminInput, type AdminInputProps } from '@jakorea/admin-ui/input'
import type { InputRef } from 'antd'
import type { CmsControlSize } from './cms-control-size'

export type CmsInputSize = CmsControlSize

function mapAdminInputSize(size?: CmsControlSize): AdminInputProps['inputSize'] {
  if (size === 'small') return 'compact'
  return size ?? 'large'
}

export interface CmsInputProps extends Omit<AdminInputProps, 'inputSize'> {
  inputSize?: CmsControlSize
}

export const CmsInput = forwardRef<InputRef, CmsInputProps>(
  ({ inputSize = 'large', allowClear = false, ...rest }, ref) => {
    return (
      <AdminInput ref={ref} inputSize={mapAdminInputSize(inputSize)} allowClear={allowClear} {...rest} />
    )
  }
)

CmsInput.displayName = 'CmsInput'
