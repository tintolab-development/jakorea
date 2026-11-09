/**
 * Admin 인풋 — SSOT는 `@jakorea/admin-ui`. allowClear 기본 false.
 * 높이: compact 32 / small 36 / medium 40 / large 44 / xlarge 52
 */

import { forwardRef } from 'react'
import { AdminInput, type AdminInputProps } from '@jakorea/admin-ui/input'
import type { InputRef } from 'antd'
import type { CmsControlSize } from './cms-control-size'
import {
  inlineReadOnlyClassName,
  inlineReadOnlyTabIndex,
  type InlineReadOnlyLook,
} from './inline-readonly'

/** 로그인 등 CMS와 동일한 52px 인풋을 위해 `xlarge`를 허용한다. 32px는 `compact`. */
export type CmsInputSize = CmsControlSize | 'xlarge' | 'compact'

function mapAdminInputSize(size?: CmsInputSize): AdminInputProps['inputSize'] {
  return size ?? 'large'
}

export interface CmsInputProps extends Omit<AdminInputProps, 'inputSize'> {
  inputSize?: CmsInputSize
  /**
   * 조회↔수정 같은 컨트롤 유지 화면에서 `readOnly`일 때의 모양 (`inline-readonly.css`).
   * 지정하면 조회 시 탭 이동에서도 빠진다.
   */
  inlineReadOnly?: InlineReadOnlyLook
}

export const CmsInput = forwardRef<InputRef, CmsInputProps>(
  (
    { inputSize = 'large', allowClear = false, inlineReadOnly, className, tabIndex, ...rest },
    ref
  ) => {
    const inlineCn = inlineReadOnlyClassName(rest.readOnly, inlineReadOnly)
    return (
      <AdminInput
        ref={ref}
        inputSize={mapAdminInputSize(inputSize)}
        allowClear={allowClear}
        className={[className, inlineCn].filter(Boolean).join(' ') || undefined}
        tabIndex={inlineReadOnlyTabIndex(rest.readOnly, inlineReadOnly, tabIndex)}
        {...rest}
      />
    )
  }
)

CmsInput.displayName = 'CmsInput'
