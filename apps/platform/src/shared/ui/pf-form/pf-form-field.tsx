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

export type PFFormFieldLabelWidth = 'default' | 'wide'
/** horizontal: 좌측 라벨 / vertical: 상단 라벨(세로형 테이블 단락) */
export type PFFormFieldLayout = 'horizontal' | 'vertical'

export type PFFormFieldProps = {
  label: string
  required?: boolean
  children: ReactNode
  /** double 행에서 전체 폭 */
  fullWidth?: boolean
  /** label(title) 영역 너비 — default 200 / wide 220 (`layout="horizontal"`만 적용) */
  labelWidth?: PFFormFieldLabelWidth
  /**
   * 필드 레이아웃.
   * - `horizontal`(기본): 라벨 | 값
   * - `vertical`: 라벨(상단 회색) / 값(하단) — 자유 작성 등 세로형 단락
   */
  layout?: PFFormFieldLayout
  className?: string
}

export function PFFormField({
  label,
  required = false,
  children,
  fullWidth = false,
  labelWidth = 'default',
  layout = 'horizontal',
  className,
}: PFFormFieldProps) {
  const isVertical = layout === 'vertical'

  return (
    <div
      className={[
        styles.field,
        isVertical ? styles.fieldVertical : undefined,
        fullWidth ? styles.fieldFull : undefined,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          styles.fieldLabel,
          isVertical ? styles.fieldLabelVertical : undefined,
          !isVertical && labelWidth === 'wide' ? styles.fieldLabelWide : undefined,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <PFText
          as="span"
          typo="form-field-label"
          className={[styles.fieldLabelText, isVertical ? styles.fieldLabelTextVertical : undefined]
            .filter(Boolean)
            .join(' ')}
        >
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
      <div
        className={[styles.fieldContent, isVertical ? styles.fieldContentVertical : undefined]
          .filter(Boolean)
          .join(' ')}
      >
        {typeof children === 'string' || typeof children === 'number' ? (
          <PFFormFieldValueText>{children}</PFFormFieldValueText>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

export type PFFormFieldValueTextProps = {
  children: ReactNode
  className?: string
  as?: 'span' | 'p'
}

/** PFFormField value 영역 — 일반 텍스트용 */
export function PFFormFieldValueText({
  children,
  className,
  as: Tag = 'span',
}: PFFormFieldValueTextProps) {
  return (
    <Tag className={[styles.fieldValueText, className].filter(Boolean).join(' ')}>{children}</Tag>
  )
}
