import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import { PAYMENT_STATEMENT_ISSUANCE_EMPTY_CALCULATION_LINES } from '@/features/template/ui/form-set/payment-statement-issuance/paragraph-config'
import { PaymentStatementIssuanceCalculationLinesTable } from '@/features/template/ui/form-set/detail-forms/payment-statement-issuance-calculation-lines-table'

interface CalculationLinesParagraphProps {
  lines?: PaymentStatementCalculationLinesViewModel
}

export function CalculationLinesParagraph({ lines }: CalculationLinesParagraphProps) {
  const linesVm = lines ?? PAYMENT_STATEMENT_ISSUANCE_EMPTY_CALCULATION_LINES

  return (
    <div className="form-editor-body payment-statement-issuance-calculation-lines-host">
      <PaymentStatementIssuanceCalculationLinesTable
        blocks={linesVm.blocks}
        formulaLabel={linesVm.formulaLabel}
        totalAmount={linesVm.totalAmount}
      />
    </div>
  )
}
