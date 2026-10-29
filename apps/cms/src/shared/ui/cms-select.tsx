import { forwardRef } from 'react'
import type { RefSelectProps } from 'antd/es/select'
import {
  AdminSelect,
  CMS_MULTI_SELECT_TAG_COLORS,
  CMS_SELECT_OPTION_POLICY,
  type AdminSelectProps,
} from '@jakorea/admin-ui/select'
import {
  isSponsorContactUnselected,
  SPONSOR_CONTACT_UNSELECTED_LABEL,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'

export { CMS_MULTI_SELECT_TAG_COLORS }
export type CmsSelectProps = AdminSelectProps

function formatSponsorSelectedLabel(value: string, optionLabel: string) {
  if (isSponsorContactUnselected(value)) return SPONSOR_CONTACT_UNSELECTED_LABEL
  return optionLabel
}

export const CmsSelect = forwardRef<RefSelectProps, CmsSelectProps>((props, ref) => {
  return (
    <AdminSelect
      {...props}
      ref={ref}
      optionPolicy={props.optionPolicy ?? CMS_SELECT_OPTION_POLICY}
      withAllOption={props.withAllOption ?? true}
      allowClear={props.allowClear ?? true}
      stripSentinelOptions={props.stripSentinelOptions ?? true}
      formatSelectedLabel={props.formatSelectedLabel ?? formatSponsorSelectedLabel}
    />
  )
})

CmsSelect.displayName = 'CmsSelect'
