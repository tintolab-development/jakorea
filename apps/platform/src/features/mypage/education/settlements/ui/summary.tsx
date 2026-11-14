import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFText } from '@/shared/ui'
import styles from './summary.module.css'

type EducationSettlementSummaryProps = {
  processLabel: string
  /** 정산 정보 표 첫 라벨. 영수증 경로는 '영수증 처리 현황'(Figma 11005:339348) */
  processTitle?: string
  completedCount: number | string
  totalCount: number | string
  feeGradeLabel?: string
  businessIncomeLabel?: string
}

export function EducationSettlementSummary({
  processLabel,
  processTitle = '지급조서 처리 현황',
  completedCount,
  totalCount,
  feeGradeLabel,
  businessIncomeLabel,
}: EducationSettlementSummaryProps) {
  const showInstructorFields = feeGradeLabel != null || businessIncomeLabel != null
  return (
    <section className={styles.section} aria-label="정산 정보">
      <PFText as="h2" typo="hl-sm" color="black" className={styles.title}>
        정산 정보
      </PFText>
      <PFFormFieldTable radius="rounded">
        <PFFormFieldRow type="double">
          <PFFormField label={processTitle} labelWidth={showInstructorFields ? undefined : 'wider'}>
            {processLabel}
          </PFFormField>
          {showInstructorFields ? (
            <PFFormField label="강사비 책정 기준">{feeGradeLabel ?? '-'}</PFFormField>
          ) : (
            <PFFormField label="프로그램 진행 회차" labelWidth="wider">
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
