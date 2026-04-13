/**
 * CMS 공통 라디오 (재사용)
 * size: large(기본) | medium — 스타일은 app-radio.css
 * 선택 라벨 색: var(--JA-mint-01, #01A1AF)
 */

import { forwardRef, type ComponentRef } from 'react'
import { Radio } from 'antd'
import type { RadioGroupProps, RadioProps } from 'antd'
import './app-radio.css'

type CmsRadioRef = ComponentRef<typeof Radio>

export type CmsRadioSize = 'large' | 'medium'

export type CmsRadioProps = RadioProps & {
  /** 기본 large: 원 20px·본문 16px·간격 8px. medium: 18px / 14px / 6px */
  size?: CmsRadioSize
}

const CmsRadioInner = forwardRef<CmsRadioRef, CmsRadioProps>(
  ({ className, rootClassName, size = 'large', ...rest }, ref) => {
    const cn = ['app-radio', `app-radio--${size}`, className].filter(Boolean).join(' ')
    return <Radio ref={ref} className={cn} rootClassName={rootClassName} {...rest} />
  }
)

CmsRadioInner.displayName = 'CmsRadio'

export type CmsRadioGroupProps = Omit<RadioGroupProps, 'size'> & {
  size?: CmsRadioSize
}

export const CmsRadioGroup = forwardRef<HTMLDivElement, CmsRadioGroupProps>(
  ({ className, rootClassName, size = 'large', ...rest }, ref) => {
    const cn = ['app-radio-group', `app-radio-group--${size}`, className]
      .filter(Boolean)
      .join(' ')
    return <Radio.Group ref={ref} className={cn} rootClassName={rootClassName} {...rest} />
  }
)

CmsRadioGroup.displayName = 'CmsRadioGroup'

export const CmsRadio = Object.assign(CmsRadioInner, {
  Group: CmsRadioGroup,
}) as typeof CmsRadioInner & { Group: typeof CmsRadioGroup }
