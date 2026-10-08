/**
 * CMS 공통 체크박스 (Ant Design Checkbox)
 * - checkboxSize: large(기본) | medium
 */

import { forwardRef, useId, type ComponentProps, type ComponentRef, type ReactNode } from 'react'
import { Checkbox } from 'antd'
import type { CheckboxProps } from 'antd'
import { CMS_CHOICE_FIELD_GROUP_CLASS, CmsChoiceField } from './cms-choice-field'
import './cms-checkbox.css'

export type CmsCheckboxSize = 'large' | 'medium'

export type CmsCheckboxProps = CheckboxProps & {
  /** large: 20px 박스·16px/130% 라벨·간격 8px / medium: 18px·14px/125%·6px */
  checkboxSize?: CmsCheckboxSize
}

type CmsCheckboxRef = ComponentRef<typeof Checkbox>

const CmsCheckboxInner = forwardRef<CmsCheckboxRef, CmsCheckboxProps>(
  ({ className, checkboxSize = 'large', ...rest }, ref) => {
    const cn = ['cms-checkbox', `cms-checkbox--${checkboxSize}`, className].filter(Boolean).join(' ')
    return <Checkbox ref={ref} className={cn} {...rest} />
  }
)

CmsCheckboxInner.displayName = 'CmsCheckbox'

export type CmsCheckboxGroupProps = ComponentProps<typeof Checkbox.Group> & {
  /** options 로 렌더할 때 자식 래퍼에 동일 박스·타이포 적용 */
  checkboxSize?: CmsCheckboxSize
  /** 그룹 위 제목 라벨 — 있으면 cms-choice-field 래퍼로 감싼다 */
  label?: ReactNode
  /** 제목 라벨 옆 필수(*) 표시 */
  required?: boolean
}

const CmsCheckboxGroup = forwardRef<HTMLDivElement, CmsCheckboxGroupProps>(
  ({ className, checkboxSize = 'large', label, required, ...rest }, ref) => {
    const labelId = useId()
    const hasLabel = label != null && label !== false && label !== ''
    const cn = [
      'cms-checkbox-group',
      `cms-checkbox-group--${checkboxSize}`,
      hasLabel ? CMS_CHOICE_FIELD_GROUP_CLASS : null,
      className,
    ]
      .filter(Boolean)
      .join(' ')
    if (!hasLabel) return <Checkbox.Group ref={ref} className={cn} {...rest} />
    return (
      <CmsChoiceField label={label} labelId={labelId} required={required} size={checkboxSize}>
        <Checkbox.Group ref={ref} className={cn} {...rest} />
      </CmsChoiceField>
    )
  }
)

CmsCheckboxGroup.displayName = 'CmsCheckboxGroup'

export const CmsCheckbox = Object.assign(CmsCheckboxInner, {
  Group: CmsCheckboxGroup,
}) as typeof CmsCheckboxInner & { Group: typeof CmsCheckboxGroup }
