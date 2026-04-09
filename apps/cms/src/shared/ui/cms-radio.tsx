/**
 * CMS 공통 라디오 (재사용)
 * CMS 전역에서 동일한 크기·테두리 사용, 선택 라벨은 var(--JA-mint-01, #01A1AF)
 */

import { forwardRef, type ComponentRef } from 'react'
import { Radio } from 'antd'
import type { RadioGroupProps, RadioProps } from 'antd'
import './app-radio.css'

type CmsRadioRef = ComponentRef<typeof Radio>

export type CmsRadioProps = RadioProps

const CmsRadioInner = forwardRef<CmsRadioRef, CmsRadioProps>(
  ({ className, rootClassName, ...rest }, ref) => {
    const cn = ['app-radio', className].filter(Boolean).join(' ')
    return <Radio ref={ref} className={cn} rootClassName={rootClassName} {...rest} />
  }
)

CmsRadioInner.displayName = 'CmsRadio'

export type CmsRadioGroupProps = RadioGroupProps

export const CmsRadioGroup = forwardRef<HTMLDivElement, CmsRadioGroupProps>(
  ({ className, rootClassName, ...rest }, ref) => {
    const cn = ['app-radio-group', className].filter(Boolean).join(' ')
    return <Radio.Group ref={ref} className={cn} rootClassName={rootClassName} {...rest} />
  }
)

CmsRadioGroup.displayName = 'CmsRadioGroup'

export const CmsRadio = Object.assign(CmsRadioInner, {
  Group: CmsRadioGroup,
}) as typeof CmsRadioInner & { Group: typeof CmsRadioGroup }
