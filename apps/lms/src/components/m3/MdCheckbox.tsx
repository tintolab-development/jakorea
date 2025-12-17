/**
 * Material Design 3 Checkbox React Wrapper
 * M3 컴포넌트를 직접 import하여 사용
 */

// M3 Checkbox 컴포넌트 import
import '@material/web/checkbox/checkbox.js'

import { createElement, useEffect, useId } from 'react'

interface MdCheckboxProps {
  checked?: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  label?: string
  id?: string
}

interface MdCheckboxElement extends HTMLElement {
  checked: boolean
  disabled: boolean
}

export default function MdCheckbox({
  checked = false,
  onChange,
  disabled = false,
  label,
  id,
}: MdCheckboxProps) {
  const generatedId = useId()
  const checkboxId = id ?? generatedId

  useEffect(() => {
    const checkbox = document.getElementById(checkboxId) as MdCheckboxElement | null
    if (!checkbox) return

    // 체크 상태 설정
    if (checked !== undefined) {
      checkbox.checked = checked
    }

    // 이벤트 리스너
    const handleChange = (e: Event) => {
      const target = e.target as MdCheckboxElement
      onChange?.(target.checked)
    }

    checkbox.addEventListener('change', handleChange)

    return () => {
      checkbox.removeEventListener('change', handleChange)
    }
  }, [checkboxId, checked, onChange])

  useEffect(() => {
    const checkbox = document.getElementById(checkboxId) as MdCheckboxElement | null
    if (!checkbox) return

    if (disabled !== undefined) {
      checkbox.disabled = disabled
    }
  }, [checkboxId, disabled])

  const checkboxElement = createElement('md-checkbox', {
    id: checkboxId,
  })

  if (label) {
    return createElement(
      'label',
      {
        style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
      },
      checkboxElement,
      label
    )
  }

  return checkboxElement
}
