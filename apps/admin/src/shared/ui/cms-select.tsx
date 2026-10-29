/**
 * Admin 셀렉트 — SSOT는 `@jakorea/admin-ui`.
 * 기존 필터 의미 보존: withAllOption 기본 false, 센티널 유지, 단일 allowClear 없음.
 */

import { forwardRef } from 'react'
import type { RefSelectProps } from 'antd/es/select'
import {
  AdminSelect,
  ADMIN_APP_SELECT_OPTION_POLICY,
  CMS_MULTI_SELECT_TAG_COLORS,
  type AdminSelectProps,
} from '@jakorea/admin-ui/select'
import type { CmsControlSize } from './cms-control-size'

export { CMS_MULTI_SELECT_TAG_COLORS }

export type CmsSelectProps = Omit<AdminSelectProps, 'inputSize'> & {
  inputSize?: CmsControlSize
}

function mapAdminControlSize(size?: CmsControlSize): AdminSelectProps['inputSize'] {
  if (size === 'small') return 'compact'
  return size ?? 'large'
}

export const CmsSelect = forwardRef<RefSelectProps, CmsSelectProps>((props, ref) => {
  const { inputSize, mode, withAllOption, allowClear, stripSentinelOptions, optionPolicy, ...rest } =
    props
  const resolvedAllowClear = mode === 'multiple' ? (allowClear ?? true) : false

  return (
    <AdminSelect
      {...rest}
      ref={ref}
      mode={mode}
      inputSize={mapAdminControlSize(inputSize)}
      optionPolicy={optionPolicy ?? ADMIN_APP_SELECT_OPTION_POLICY}
      withAllOption={withAllOption ?? false}
      stripSentinelOptions={stripSentinelOptions ?? false}
      allowClear={resolvedAllowClear}
    />
  )
})

CmsSelect.displayName = 'CmsSelect'
