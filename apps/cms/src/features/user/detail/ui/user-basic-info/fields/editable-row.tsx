import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

export interface EditableRowProps {
  type: 'single' | 'double'
  children: ReactNode
  className?: string
}

export function EditableRow({ type, children, className }: EditableRowProps) {
  return (
    <DetailInfoForm.Row type={type} className={className}>
      {children}
    </DetailInfoForm.Row>
  )
}
