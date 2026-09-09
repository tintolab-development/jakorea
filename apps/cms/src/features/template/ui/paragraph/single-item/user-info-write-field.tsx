import { useState } from 'react'
import {
  formatUserInfoWritePlaceholder,
  type UserInfoParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { CmsInput } from '@/shared/ui'

export function UserInfoWriteField({
  paragraph,
  fieldKey,
  label,
  persist,
  onChange,
}: {
  paragraph: UserInfoParagraph
  fieldKey: string
  label: string
  persist: boolean
  onChange?: (next: UserInfoParagraph) => void
}) {
  const [localValue, setLocalValue] = useState(() => paragraph.fieldAnswers?.[fieldKey] ?? '')
  const value = persist ? (paragraph.fieldAnswers?.[fieldKey] ?? '') : localValue

  return (
    <CmsInput
      inputSize="large"
      width="100%"
      value={value}
      placeholder={formatUserInfoWritePlaceholder(label)}
      onChange={event => {
        const nextValue = event.target.value
        if (persist && onChange) {
          onChange({
            ...paragraph,
            fieldAnswers: { ...paragraph.fieldAnswers, [fieldKey]: nextValue },
          })
          return
        }
        setLocalValue(nextValue)
      }}
    />
  )
}
