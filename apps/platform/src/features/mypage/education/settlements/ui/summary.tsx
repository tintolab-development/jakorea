import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFText } from '@/shared/ui'
import styles from './summary.module.css'

type EducationSettlementSummaryProps = {
  processLabel: string
  completedCount: number | string
  totalCount: number | string
  feeGradeLabel?: string
  businessIncomeLabel?: string
  /**
   * gemini: Figma 11001-287013 — 1행 지급조서 처리 현황 | 프로그램 진행 회차 | 사업소득자 여부,
   * 2행 강의비 책정 기준(전체 폭).
   */
  layout?: 'default' | 'gemini'
  /** gemini: 차시별 강의비(`1차시 0원` …). 비어 있으면 feeGradeLabel 한 줄 */
  feeBasisItems?: readonly string[]
}

export function EducationSettlementSummary({
  processLabel,
  completedCount,
  totalCount,
  feeGradeLabel,
  businessIncomeLabel,
  layout = 'default',
  feeBasisItems = [],
}: EducationSettlementSummaryProps) {
  const showInstructorFields = feeGradeLabel != null || businessIncomeLabel != null
  const sessionValue = (
    <span className={styles.sessionValue}>
      <PFText as="span" typo="bd-lg-sb" color="black">
        {completedCount}
      </PFText>
      <PFText as="span" typo="bd-md-md" color="black">
        /{totalCount} 건
      </PFText>
      <PFText as="span" typo="bd-md-rg" color="neutral-warm-500">
        {' '}
        (강의 진행 회차 기준)
      </PFText>
    </span>
  )
  if (layout === 'gemini') {
    return (
      <section className={styles.section} aria-label="정산 정보">
        <PFText as="h2" typo="hl-sm" color="black" className={styles.title}>
          정산 정보
        </PFText>
        <PFFormFieldTable radius="rounded" className={styles.geminiTable}>
          <PFFormFieldRow type="double" className={styles.geminiTripleRow}>
            <PFFormField label="지급조서 처리 현황" labelWidth="wider">
              {processLabel}
            </PFFormField>
            <PFFormField label="프로그램 진행 회차" labelWidth="wider">
              {sessionValue}
            </PFFormField>
            <PFFormField label="사업소득자 여부" labelWidth="wider">
              {businessIncomeLabel ?? '-'}
            </PFFormField>
          </PFFormFieldRow>
          <PFFormFieldRow>
            <PFFormField label="강의비 책정 기준" labelWidth="wider">
              {feeBasisItems.length > 0 ? (
                <span className={styles.feeBasisList}>
                  {feeBasisItems.map((label, index) => (
                    <span key={`${index}-${label}`} className={styles.feeBasisItem}>
                      {index > 0 ? <span className={styles.feeBasisDivider} aria-hidden="true" /> : null}
                      {label}
                    </span>
                  ))}
                </span>
              ) : (
                (feeGradeLabel ?? '-')
              )}
            </PFFormField>
          </PFFormFieldRow>
        </PFFormFieldTable>
      </section>
    )
  }
  return (
    <section className={styles.section} aria-label="정산 정보">
      <PFText as="h2" typo="hl-sm" color="black" className={styles.title}>
        정산 정보
      </PFText>
      <PFFormFieldTable radius="rounded">
        <PFFormFieldRow type="double">
          <PFFormField label="지급조서 처리 현황">{processLabel}</PFFormField>
          {showInstructorFields ? (
            <PFFormField label="강의비 책정 기준">{feeGradeLabel ?? '-'}</PFFormField>
          ) : (
            <PFFormField label="프로그램 진행 회차">
              <span className={styles.sessionValue}>
                <PFText as="span" typo="bd-lg-sb" color="black">
                  {completedCount}
                </PFText>
                <PFText as="span" typo="bd-md-md" color="black">
                  /{totalCount} 건
                </PFText>
                <PFText as="span" typo="bd-md-rg" color="neutral-warm-500">
                  {' '}
                  (강의 진행 회차 기준)
                </PFText>
              </span>
            </PFFormField>
          )}
        </PFFormFieldRow>
        {showInstructorFields ? (
          <PFFormFieldRow type="double">
            <PFFormField label="프로그램 진행 회차">
              <span className={styles.sessionValue}>
                <PFText as="span" typo="bd-lg-sb" color="black">
                  {completedCount}
                </PFText>
                <PFText as="span" typo="bd-md-md" color="black">
                  /{totalCount} 건
                </PFText>
                <PFText as="span" typo="bd-md-rg" color="neutral-warm-500">
                  {' '}
                  (강의 진행 회차 기준)
                </PFText>
              </span>
            </PFFormField>
            <PFFormField label="사업소득자 여부">{businessIncomeLabel ?? '-'}</PFFormField>
          </PFFormFieldRow>
        ) : null}
      </PFFormFieldTable>
    </section>
  )
}
