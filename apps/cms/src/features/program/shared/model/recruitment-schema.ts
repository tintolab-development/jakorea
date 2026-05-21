import type { ReactNode } from 'react'

export type FieldSchema = {
  label: string
  view: ReactNode
  edit?: ReactNode
  required?: boolean
  fullRow?: boolean
}

export type RowSchema = {
  columns?: 1 | 2
  fields: FieldSchema[]
}

export type SectionSchema = {
  rows: RowSchema[]
}
