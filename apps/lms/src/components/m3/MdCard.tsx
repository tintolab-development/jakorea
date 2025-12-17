/**
 * Material Design 3 Card React Wrapper
 * M3 컴포넌트를 직접 import하여 사용
 * (Card는 labs 패키지에 있음)
 */

// M3 Card 컴포넌트 import (labs)
import '@material/web/labs/card/elevated-card.js'
import '@material/web/labs/card/filled-card.js'
import '@material/web/labs/card/outlined-card.js'

import { createElement } from 'react'

interface MdCardProps {
  children: React.ReactNode
  variant?: 'elevated' | 'filled' | 'outlined'
  className?: string
}

export default function MdCard({ children, variant = 'elevated', className = '' }: MdCardProps) {
  const tagName = `md-${variant}-card` as 'md-elevated-card'

  return createElement(
    tagName,
    {
      className,
    },
    children
  )
}
