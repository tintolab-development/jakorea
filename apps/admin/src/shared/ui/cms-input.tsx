/**
 * Admin 인풋 — SSOT는 `@jakorea/admin-ui`. allowClear 기본 false.
 * 높이: compact 32 / small 36 / medium 40 / large 44 / xlarge 52
 */

import { forwardRef } from 'react'
import { AdminInput, type AdminInputProps } from '@jakorea/admin-ui/input'
import type { InputRef } from 'antd'
import type { CmsControlSize } from './cms-control-size'

/** 로그인 등 CMS와 동일한 52px 인풋을 위해 `xlarge`를 허용한다. 32px는 `compact`. */
export type CmsInputSize = CmsControlSize | 'xlarge' | 'compact'

function mapAdminInputSize(size?: CmsInputSize): AdminInputProps['inputSize'] {
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
