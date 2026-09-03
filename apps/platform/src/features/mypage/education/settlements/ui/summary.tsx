import { PFFormField, PFFormFieldRow, PFFormFieldTable, PFText } from '@/shared/ui'
import styles from './summary.module.css'

type EducationSettlementSummaryProps = {
  processLabel: string
  completedCount: number
  totalCount: number
}

export function EducationSettlementSummary({
  processLabel,
  completedCount,
  totalCount,
}: EducationSettlementSummaryProps) {
  return (
    <section className={styles.section} aria-label="정산 정보">
      <PFText as="h2" typo="hl-sm" color="black" className={styles.title}>
        정산 정보
      </PFText>
      <PFFormFieldTable radius="rounded">
        <PFFormFieldRow type="double">
          <PFFormField label="지급조서 처리 현황">{processLabel}</PFFormField>
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
        </PFFormFieldRow>
      </PFFormFieldTable>
    </section>
  )
}
