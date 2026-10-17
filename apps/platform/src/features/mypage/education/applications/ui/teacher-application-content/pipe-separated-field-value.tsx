import { PFFormInlineJoinedValues } from '@/shared/ui'
import { splitPipeSeparatedParts } from './split-pipe-parts'
import styles from './teacher-application-content.module.css'

type PipeSeparatedFieldValueProps = {
  value: string
}

/** PFFormField 읽기 전용 — `a | b` 문자 대신 신청 내용 일정과 동일 세로 구분선 */
export function PipeSeparatedFieldValue({ value }: PipeSeparatedFieldValueProps) {
  const parts = splitPipeSeparatedParts(value)
  if (parts.length === 0) {
    return <p className={styles.fieldValue}>–</p>
  }
  if (parts.length === 1) {
    return <p className={styles.fieldValue}>{parts[0]}</p>
  }
  return <PFFormInlineJoinedValues parts={parts} emptyFallback="–" />
}
