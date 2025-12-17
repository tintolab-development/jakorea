/**
 * Material Design 3 Select Option
 * M3 컴포넌트를 직접 import하여 사용
 */

// M3 Select Option 컴포넌트 import
import '@material/web/select/select-option.js'

import { createElement } from 'react'

interface MdSelectOptionProps {
  value: string
  children: React.ReactNode
}

export default function MdSelectOption({ value, children }: MdSelectOptionProps) {
  return createElement(
    'md-select-option',
    {
      value,
    },
    children
  )
}
