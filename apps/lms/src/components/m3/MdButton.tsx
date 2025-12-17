/**
 * Material Design 3 Button React Wrapper
 * M3 컴포넌트를 직접 import하여 사용
 * M3의 기본 스타일을 그대로 사용하도록 최소한의 래핑만 수행
 */

// M3 Button 컴포넌트 import
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/text-button.js'
import '@material/web/button/filled-tonal-button.js'
import '@material/web/button/elevated-button.js'

import { createElement, useEffect, useId } from 'react'
import './MdButton.css'

interface MdButtonProps {
  variant?: 'filled' | 'outlined' | 'text' | 'tonal' | 'elevated'
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  ariaLabel?: string
}

interface MdButtonElement extends HTMLElement {
  disabled: boolean
}

export default function MdButton({
  variant = 'filled',
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  ariaLabel,
}: MdButtonProps) {
  const buttonId = useId()

  useEffect(() => {
    const button = document.getElementById(buttonId) as MdButtonElement | null
    if (!button) return

    // disabled 속성 설정
    button.disabled = disabled

    // aria-label 설정
    if (ariaLabel) {
      button.setAttribute('aria-label', ariaLabel)
    } else {
      button.removeAttribute('aria-label')
    }

    // 클릭 이벤트 리스너
    if (onClick) {
      const handleClick = () => {
        onClick()
      }
      button.addEventListener('click', handleClick)
      return () => {
        button.removeEventListener('click', handleClick)
      }
    }
  }, [buttonId, disabled, ariaLabel, onClick])

  // M3 버튼 태그명 매핑
  const tagNameMap: Record<string, string> = {
    filled: 'md-filled-button',
    outlined: 'md-outlined-button',
    text: 'md-text-button',
    tonal: 'md-filled-tonal-button',
    elevated: 'md-elevated-button',
  }

  const tagName = tagNameMap[variant] || 'md-filled-button'

  return createElement(
    tagName,
    {
      id: buttonId,
      className: className || undefined,
      type,
      disabled: disabled || undefined,
      ...(ariaLabel && { 'aria-label': ariaLabel }),
    },
    children
  )
}
