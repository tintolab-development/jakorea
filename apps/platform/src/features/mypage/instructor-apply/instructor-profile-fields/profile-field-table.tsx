import { PFFormFieldTable, type PFFormFieldTableProps } from '@/shared/ui'
import inlineFieldStyles from './settings-inline-fields.module.css'
import type { InstructorProfileFieldSurface } from './types'

type InstructorProfileFieldTableProps = Omit<PFFormFieldTableProps, 'className'> & {
  surface?: InstructorProfileFieldSurface
}

export function InstructorProfileFieldTable({
  surface = 'apply',
  ...props
}: InstructorProfileFieldTableProps) {
  return (
    <PFFormFieldTable
      {...props}
      className={surface === 'settings' ? inlineFieldStyles.fieldTablePlain : undefined}
    />
  )
}

export function resolveInstructorProfileFieldLayout(
  surface: InstructorProfileFieldSurface = 'apply',
): 'horizontal' | 'vertical' {
  return surface === 'settings' ? 'vertical' : 'horizontal'
}
