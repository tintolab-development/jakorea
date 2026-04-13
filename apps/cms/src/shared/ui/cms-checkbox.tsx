/**
 * CMS 공통 체크박스 (Ant Design Checkbox)
 * - checkboxSize: large(기본) | medium
 */

import { forwardRef, type ComponentProps, type ComponentRef } from 'react'
import { Checkbox } from 'antd'
import type { CheckboxProps } from 'antd'
import './cms-checkbox.css'

export type CmsCheckboxSize = 'large' | 'medium'

export type CmsCheckboxProps = CheckboxProps & {
  /** large: 20px 박스·16px 라벨·간격 8px / medium: 18px·15px·6px */
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
}

const CmsCheckboxGroup = forwardRef<HTMLDivElement, CmsCheckboxGroupProps>(
  ({ className, checkboxSize = 'large', ...rest }, ref) => {
    const cn = ['cms-checkbox-group', `cms-checkbox-group--${checkboxSize}`, className]
      .filter(Boolean)
      .join(' ')
    return <Checkbox.Group ref={ref} className={cn} {...rest} />
  }
)

CmsCheckboxGroup.displayName = 'CmsCheckboxGroup'

export const CmsCheckbox = Object.assign(CmsCheckboxInner, {
  Group: CmsCheckboxGroup,
}) as typeof CmsCheckboxInner & { Group: typeof CmsCheckboxGroup }
