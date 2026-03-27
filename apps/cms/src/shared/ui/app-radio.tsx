/**
 * 앱 공통 라디오 (재사용)
 * CMS 전역에서 동일한 크기·테두리 사용, 선택 라벨은 var(--JA-mint-01, #01A1AF)
 */

import { forwardRef, type ComponentRef } from 'react'
import { Radio } from 'antd'
import type { RadioGroupProps, RadioProps } from 'antd'
import './app-radio.css'

type AppRadioRef = ComponentRef<typeof Radio>

export type AppRadioProps = RadioProps

const AppRadioInner = forwardRef<AppRadioRef, AppRadioProps>(
  ({ className, rootClassName, ...rest }, ref) => {
    const cn = ['app-radio', className].filter(Boolean).join(' ')
    return <Radio ref={ref} className={cn} rootClassName={rootClassName} {...rest} />
  }
)

AppRadioInner.displayName = 'AppRadio'

export type AppRadioGroupProps = RadioGroupProps

export const AppRadioGroup = forwardRef<HTMLDivElement, AppRadioGroupProps>(
  ({ className, rootClassName, ...rest }, ref) => {
    const cn = ['app-radio-group', className].filter(Boolean).join(' ')
    return <Radio.Group ref={ref} className={cn} rootClassName={rootClassName} {...rest} />
  }
)

AppRadioGroup.displayName = 'AppRadioGroup'

export const AppRadio = Object.assign(AppRadioInner, {
  Group: AppRadioGroup,
}) as typeof AppRadioInner & { Group: typeof AppRadioGroup }
