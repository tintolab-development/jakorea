import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

export interface NameBlockRow {
  subLabel: string
  main: ReactNode
  sideLabel: string
  side: ReactNode
}

export interface NameBlockFieldProps {
  rows: readonly [NameBlockRow, NameBlockRow]
  className?: string
}

export function NameBlockField({ rows, className }: NameBlockFieldProps) {
  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.NameBlock rows={rows} className={className} />
    </DetailInfoForm.Row>
  )
}
