/**
 * Admin 인풋 — SSOT는 `@jakorea/admin-ui`. 기존 size(small=32)와 allowClear 기본 false를 보존한다.
 */

import { forwardRef } from 'react'
import { AdminInput, type AdminInputProps } from '@jakorea/admin-ui/input'
import type { InputRef } from 'antd'
import type { CmsControlSize } from './cms-control-size'

/** 로그인 등 CMS와 동일한 52px 인풋을 위해 `xlarge`를 허용한다. */
export type CmsInputSize = CmsControlSize | 'xlarge'

function mapAdminInputSize(size?: CmsInputSize): AdminInputProps['inputSize'] {
  if (size === 'small') return 'compact'
  return size ?? 'large'
}

export interface CmsInputProps extends Omit<AdminInputProps, 'inputSize'> {
  inputSize?: CmsInputSize
}

export const CmsInput = forwardRef<InputRef, CmsInputProps>(
  ({ inputSize = 'large', allowClear = false, ...rest }, ref) => {
    return (
      <AdminInput ref={ref} inputSize={mapAdminInputSize(inputSize)} allowClear={allowClear} {...rest} />
    )
  }
)

CmsInput.displayName = 'CmsInput'
