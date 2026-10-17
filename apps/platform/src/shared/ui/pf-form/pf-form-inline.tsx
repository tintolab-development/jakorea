import { Children, Fragment, type HTMLAttributes, type ReactNode } from 'react'
import { PFText } from '../pf-text'
import { PFFormFieldValueText } from './pf-form-field'
import styles from './pf-form.module.css'

export type PFFormInlineRowProps = {
  children: ReactNode
  className?: string
}

/** Divider 세그먼트 줄바꿈 컨테이너 — 폭 부족 시 Separator 기준으로만 wrap */
export function PFFormInlineRow({ children, className }: PFFormInlineRowProps) {
  return (
    <div className={[styles.inlineRow, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

export type PFFormInlineSegmentProps = {
  children: ReactNode
  className?: string
}

/** 세그먼트 내부는 nowrap — Divider 사이에서만 개행 */
export function PFFormInlineSegment({ children, className }: PFFormInlineSegmentProps) {
  return (
    <div className={[styles.inlineSegment, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

export type PFFormInlineSeparatorProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  className?: string
}

/** 인라인 세로 구분선 1×13 — 줄바꿈 경계 */
export function PFFormInlineSeparator({ className, ...rest }: PFFormInlineSeparatorProps) {
  return (
    <span
      className={[styles.inlineSeparator, className].filter(Boolean).join(' ')}
      aria-hidden
      {...rest}
    />
  )
}

export type PFFormInlineSeparatedFieldsProps = {
  children: ReactNode
  className?: string
}

/** 인라인 필드·텍스트 사이 `PFFormInlineSeparator` (16px 간격) 자동 삽입 */
export function PFFormInlineSeparatedFields({
  children,
  className,
}: PFFormInlineSeparatedFieldsProps) {
  const items = Children.toArray(children)
  if (items.length === 0) return null

  return (
    <PFFormInlineRow className={className}>
      {items.map((child, index) => (
        <Fragment key={index}>
          {index > 0 ? <PFFormInlineSeparator /> : null}
          <PFFormInlineSegment>{child}</PFFormInlineSegment>
        </Fragment>
      ))}
    </PFFormInlineRow>
  )
}

export type PFFormInlineJoinedValuesProps = {
  parts: Array<string | null | undefined>
  emptyFallback?: string
}

/** 읽기 전용 값 목록 — 문자 `|` 대신 세로 구분선 */
export function PFFormInlineJoinedValues({
  parts,
  emptyFallback = '–',
}: PFFormInlineJoinedValuesProps) {
  const items = parts
    .map(part => (part == null ? '' : String(part).trim()))
    .filter(Boolean)

  if (items.length === 0) {
    return <PFFormFieldValueText>{emptyFallback}</PFFormFieldValueText>
  }

  return (
    <PFFormInlineSeparatedFields>
      {items.map((item, index) => (
        <PFFormFieldValueText key={index}>{item}</PFFormFieldValueText>
      ))}
    </PFFormInlineSeparatedFields>
  )
}

export type PFFormControlClusterProps = {
  children: ReactNode
  className?: string
}

/** 컨트롤 + 라벨·suffix를 한 줄(모바일 포함 wrap)로 묶음 */
export function PFFormControlCluster({ children, className }: PFFormControlClusterProps) {
  return (
    <div className={[styles.controlCluster, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

export type PFFormControlSuffixProps = {
  children: ReactNode
  className?: string
}

/** `PFFormControlCluster` 내 인풋 우측 단위·보조 문구 */
export function PFFormControlSuffix({ children, className }: PFFormControlSuffixProps) {
  return (
    <PFText
      as="span"
      typo="bd-md-rg"
      color="neutral-cool-700"
      className={[styles.controlClusterSuffix, className].filter(Boolean).join(' ')}
    >
      {children}
    </PFText>
  )
}

export type PFFormPeriodPairProps = {
  children: ReactNode
  className?: string
}

/** 입사~퇴사 / 주민 앞·뒤 — 모바일에서도 50% ~ 50% 가로 유지 */
export function PFFormPeriodPair({ children, className }: PFFormPeriodPairProps) {
  return (
    <div className={[styles.periodPair, className].filter(Boolean).join(' ')}>{children}</div>
  )
}

export type PFFormPeriodTildeProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  className?: string
}

/** 기간·주민번호 쌍 사이 `~` (모바일 margin-inline 2px) */
export function PFFormPeriodTilde({ className, ...rest }: PFFormPeriodTildeProps) {
  return (
    <span
      className={[styles.periodTilde, className].filter(Boolean).join(' ')}
      aria-hidden
      {...rest}
    >
      ~
    </span>
  )
}

export type PFFormPeriodHyphenProps = Omit<HTMLAttributes<HTMLSpanElement>, 'children'> & {
  className?: string
}

/** 주민등록번호 앞·뒤 쌍 사이 `-` (모바일 margin-inline 2px) */
export function PFFormPeriodHyphen({ className, ...rest }: PFFormPeriodHyphenProps) {
  return (
    <span
      className={[styles.periodHyphen, className].filter(Boolean).join(' ')}
      aria-hidden
      {...rest}
    >
      -
    </span>
  )
}
