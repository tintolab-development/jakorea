import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

export interface EditableFieldProps {
  label: string
  view: ReactNode
  edit?: ReactNode
  readOnlyDisplay?: boolean
  fullRow?: boolean
  /** 수정 모드 라벨 필수 `*` (DetailInfoForm edit 모드에서만 표시) */
  required?: boolean
}

export function EditableField({
  label,
  view,
  edit,
  readOnlyDisplay,
  fullRow,
  required,
}: EditableFieldProps) {
  return (
    <DetailInfoForm.Field
      label={label}
      view={view}
      edit={edit}
      readOnlyDisplay={readOnlyDisplay}
      fullRow={fullRow}
      required={required}
    />
  )
}
