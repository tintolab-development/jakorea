import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PAYMENT_STATEMENT_ISSUANCE_IDS } from '@/features/template/model/payment-statement-issuance-draft'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/payment-statement-basic-info-detail-form'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/lecture-fee-calculation-detail-form'
import { BasicInfoParagraph } from '@/features/template/ui/form-set/payment-statement-issuance/paragraphs/basic-info-paragraph'
import { CalculationLinesParagraph } from '@/features/template/ui/form-set/payment-statement-issuance/paragraphs/calculation-lines-paragraph'
import { LectureFeeCalculationParagraph } from '@/features/template/ui/form-set/payment-statement-issuance/paragraphs/lecture-fee-calculation-paragraph'
import { WorkLogParagraph } from '@/features/template/ui/form-set/payment-statement-issuance/paragraphs/work-log-paragraph'

export interface PaymentStatementIssuanceParagraphBodyValues {
  basicInfo?: Partial<PaymentStatementBasicInfoAutofillValues>
  lectureFeeCalculation?: Partial<LectureFeeCalculationAutofillValues>
  calculationLines?: PaymentStatementCalculationLinesViewModel
}

interface RenderPaymentStatementIssuanceParagraphBodyParams {
  paragraph: HorizontalTableParagraph
  values?: PaymentStatementIssuanceParagraphBodyValues
}

export function renderPaymentStatementIssuanceParagraphBody({
  paragraph,
  values,
}: RenderPaymentStatementIssuanceParagraphBodyParams) {
  switch (paragraph.id) {
    case PAYMENT_STATEMENT_ISSUANCE_IDS.tableBasic:
      return <BasicInfoParagraph values={values?.basicInfo} />
    case PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo:
      return <LectureFeeCalculationParagraph values={values?.lectureFeeCalculation} />
    case PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcLines:
      return <CalculationLinesParagraph lines={values?.calculationLines} />
    case PAYMENT_STATEMENT_ISSUANCE_IDS.tableWorkLog:
      return <WorkLogParagraph />
    default:
      return null
  }
}
