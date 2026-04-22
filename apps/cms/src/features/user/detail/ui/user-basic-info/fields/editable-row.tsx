import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

export interface EditableRowProps {
  type: 'single' | 'double'
  children: ReactNode
}

export function EditableRow({ type, children }: EditableRowProps) {
  return <DetailInfoForm.Row type={type}>{children}</DetailInfoForm.Row>
}
