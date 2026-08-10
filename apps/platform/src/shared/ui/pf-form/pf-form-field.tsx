import type { ReactNode } from 'react'
import { PFText } from '../pf-text'
import styles from './pf-form.module.css'

export type PFFormFieldTableProps = {
  children: ReactNode
  className?: string
}

export function PFFormFieldTable({ children, className }: PFFormFieldTableProps) {
  return (
    <div className={[styles.fieldTable, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

export type PFFormFieldRowProps = {
  type?: 'single' | 'double'
  children: ReactNode
  className?: string
}

export function PFFormFieldRow({ type = 'single', children, className }: PFFormFieldRowProps) {
  return (
    <div
      className={[
        styles.fieldRow,
        type === 'double' ? styles.fieldRowDouble : styles.fieldRowSingle,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}

export type PFFormFieldProps = {
  label: string
  required?: boolean
  children: ReactNode
  /** double 행에서 전체 폭 */
  fullWidth?: boolean
  className?: string
}

export function PFFormField({
  label,
  required = false,
  children,
  fullWidth = false,
  className,
}: PFFormFieldProps) {
  return (
    <div
      className={[styles.field, fullWidth ? styles.fieldFull : undefined, className]
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.fieldLabel}>
        <PFText as="span" typo="form-field-label" className={styles.fieldLabelText}>
          {label}
        </PFText>
        {required ? (
          <PFText
            as="span"
            typo="bd-lg-sb"
            color="error"
            className={styles.fieldLabelRequired}
            aria-hidden
          >
            *
          </PFText>
        ) : null}
      </div>
      <div className={styles.fieldContent}>{children}</div>
    </div>
  )
}
