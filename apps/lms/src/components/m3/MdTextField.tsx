/**
 * Material Design 3 TextField React Wrapper
 * M3 컴포넌트를 직접 import하여 사용
 */

// M3 TextField 컴포넌트 import
import '@material/web/textfield/outlined-text-field.js'
import '@material/web/textfield/filled-text-field.js'

import { createElement, useEffect, useImperativeHandle, forwardRef, useId } from 'react'
import './MdTextField.css'

export interface MdTextFieldRef {
  value: string
  focus: () => void
}

export interface MdTextFieldProps {
  label: string
  value?: string
  onChange?: (value: string) => void
  type?: 'text' | 'email' | 'tel' | 'number' | 'password'
  required?: boolean
  error?: boolean
  errorText?: string
  disabled?: boolean
  placeholder?: string
  helperText?: string
  supportingText?: string
  variant?: 'filled' | 'outlined'
}

interface MdTextFieldElement extends HTMLElement {
  value: string
  disabled: boolean
  required: boolean
  error: boolean
  errorText: string
  supportingText: string
  placeholder: string
  type: string
  focus: () => void
}

const MdTextField = forwardRef<MdTextFieldRef, MdTextFieldProps>(
  (
    {
      label,
      value = '',
      onChange,
      type = 'text',
      required = false,
      error = false,
      errorText,
      disabled = false,
      placeholder,
      helperText,
      supportingText,
      variant = 'outlined',
    },
    ref
  ) => {
    const textFieldId = useId()

    useImperativeHandle(ref, () => ({
      get value() {
        const textField = document.getElementById(textFieldId) as MdTextFieldElement | null
        return textField?.value || ''
      },
      focus: () => {
        const textField = document.getElementById(textFieldId) as MdTextFieldElement | null
        textField?.focus()
      },
    }))

    useEffect(() => {
      const textField = document.getElementById(textFieldId) as MdTextFieldElement | null
      if (!textField) return

      // 값 설정
      if (value !== undefined && textField.value !== value) {
        textField.value = value
      }

      // 이벤트 리스너
      const handleInput = (e: Event) => {
        const target = e.target as MdTextFieldElement
        onChange?.(target.value)
      }

      textField.addEventListener('input', handleInput)

      return () => {
        textField.removeEventListener('input', handleInput)
      }
    }, [textFieldId, value, onChange])

    useEffect(() => {
      const textField = document.getElementById(textFieldId) as MdTextFieldElement | null
      if (!textField) return

      if (disabled !== undefined) {
        textField.disabled = disabled
      }
      if (required !== undefined) {
        textField.required = required
      }
      if (error !== undefined) {
        textField.error = error
      }
      if (errorText !== undefined) {
        textField.errorText = errorText
      }
      if (supportingText !== undefined || helperText !== undefined) {
        textField.supportingText = supportingText || helperText || ''
      }
      if (placeholder !== undefined) {
        textField.placeholder = placeholder
      }
      if (type !== undefined) {
        textField.type = type
      }
    }, [
      textFieldId,
      disabled,
      required,
      error,
      errorText,
      supportingText,
      helperText,
      placeholder,
      type,
    ])

    const tagName = `md-${variant}-text-field`

    return createElement(tagName, {
      id: textFieldId,
      label,
    })
  }
)

MdTextField.displayName = 'MdTextField'

export default MdTextField
