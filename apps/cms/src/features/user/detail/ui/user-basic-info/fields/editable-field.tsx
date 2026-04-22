import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

export interface EditableFieldProps {
  label: string
  view: ReactNode
  edit?: ReactNode
  readOnlyDisplay?: boolean
  fullRow?: boolean
}

export function EditableField({ label, view, edit, readOnlyDisplay, fullRow }: EditableFieldProps) {
  return (
    <DetailInfoForm.Field
      label={label}
      view={view}
      edit={edit}
      readOnlyDisplay={readOnlyDisplay}
      fullRow={fullRow}
    />
  )
}
