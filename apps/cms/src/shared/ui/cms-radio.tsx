/**
 * CMS 공통 라디오 (재사용)
 * size: large(기본) | medium — 스타일은 app-radio.css
 * 선택 라벨 색: var(--JA-mint-01, #01A1AF)
 * Group에 size를 주면 자식 CmsRadio도 동일 size를 상속한다.
 */

import {
  createContext,
  forwardRef,
  useContext,
  type ComponentRef,
} from 'react'
import { Radio } from 'antd'
import type { RadioGroupProps, RadioProps, RadioRef } from 'antd/es/radio/interface'
import type { RadioButtonProps } from 'antd/es/radio/radioButton'
import './app-radio.css'

type CmsRadioRef = ComponentRef<typeof Radio>

export type CmsRadioSize = 'large' | 'medium'

const CmsRadioSizeContext = createContext<CmsRadioSize | undefined>(undefined)

export type CmsRadioProps = RadioProps & {
  /** 기본 large: 원 20px·본문 16px·원–텍스트 8px. medium: 18px / 15px / 6px */
  size?: CmsRadioSize
}

const CmsRadioInner = forwardRef<CmsRadioRef, CmsRadioProps>(
  ({ className, rootClassName, size: sizeProp, ...rest }, ref) => {
    const sizeFromGroup = useContext(CmsRadioSizeContext)
    const size = sizeProp ?? sizeFromGroup ?? 'large'
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
    const cn = ['app-radio-group', `app-radio-group--${size}`, className].filter(Boolean).join(' ')
    return (
      <CmsRadioSizeContext.Provider value={size}>
        <Radio.Group ref={ref} className={cn} rootClassName={rootClassName} {...rest} />
      </CmsRadioSizeContext.Provider>
    )
  }
)

CmsRadioGroup.displayName = 'CmsRadioGroup'

const CmsRadioButton = forwardRef<RadioRef, RadioButtonProps>(
  ({ className, rootClassName, ...rest }, ref) => (
    <Radio.Button ref={ref} className={className} rootClassName={rootClassName} {...rest} />
  )
)

CmsRadioButton.displayName = 'CmsRadioButton'

export const CmsRadio = Object.assign(CmsRadioInner, {
  Group: CmsRadioGroup,
  Button: CmsRadioButton,
}) as typeof CmsRadioInner & { Group: typeof CmsRadioGroup; Button: typeof CmsRadioButton }

export { CmsRadioButton }
export type { RadioButtonProps as CmsRadioButtonProps }
