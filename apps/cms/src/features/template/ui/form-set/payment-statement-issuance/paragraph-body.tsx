import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PAYMENT_STATEMENT_ISSUANCE_IDS } from '@/features/template/model/payment-statement-issuance-draft'
import { PAYMENT_STATEMENT_PRE_CONSENT_IDS } from '@/features/template/model/payment-statement-pre-consent-draft'
import { SETTLEMENT_APPLICATION_ISSUANCE_IDS } from '@/features/template/model/settlement-application-issuance-draft'
import type { PaymentStatementCalculationLinesViewModel } from '@/features/template/model/lecture-fee-calculation-lines-sample'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/payment-statement-basic-info-detail-form'
import type { LectureFeeCalculationAutofillValues } from '@/features/template/ui/form-set/lecture-fee-calculation-detail-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { BasicInfoParagraph } from '@/features/template/ui/form-set/payment-statement-issuance/paragraphs/basic-info-paragraph'
import { CalculationLinesParagraph } from '@/features/template/ui/form-set/payment-statement-issuance/paragraphs/calculation-lines-paragraph'
import { LectureFeeCalculationParagraph } from '@/features/template/ui/form-set/payment-statement-issuance/paragraphs/lecture-fee-calculation-paragraph'
import { WorkLogParagraph } from '@/features/template/ui/form-set/payment-statement-issuance/paragraphs/work-log-paragraph'
import { AccommodationFeeApplicationParagraph } from '@/features/template/ui/form-set/settlement-application-issuance/paragraphs/accommodation-fee-application-paragraph'
import { TransportFeeApplicationParagraph } from '@/features/template/ui/form-set/settlement-application-issuance/paragraphs/transport-fee-application-paragraph'
import '../settlement-application-issuance/issuance-footnote.css'

function SettlementApplicationIssuanceFootnote({
  paragraph,
}: {
  paragraph: HorizontalTableParagraph
}) {
  if (!paragraph.showBottomText || !paragraph.bottomText.trim()) return null
  return <div className="settlement-application-issuance-footnote">{paragraph.bottomText}</div>
}

export interface PaymentStatementIssuanceParagraphBodyValues {
  basicInfo?: Partial<PaymentStatementBasicInfoAutofillValues>
  lectureFeeCalculation?: Partial<LectureFeeCalculationAutofillValues>
  calculationLines?: PaymentStatementCalculationLinesViewModel
}

interface RenderPaymentStatementIssuanceParagraphBodyParams {
  paragraph: HorizontalTableParagraph
  values?: PaymentStatementIssuanceParagraphBodyValues
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
}

export function renderPaymentStatementIssuanceParagraphBody({
  paragraph,
  values,
  displayMode = 'editor',
}: RenderPaymentStatementIssuanceParagraphBodyParams) {
  switch (paragraph.id) {
    case PAYMENT_STATEMENT_ISSUANCE_IDS.tableBasic:
    case PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableBasic:
      return <BasicInfoParagraph values={values?.basicInfo} displayMode={displayMode} />
    case PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcInfo:
    case PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableCalcInfo:
      return <LectureFeeCalculationParagraph values={values?.lectureFeeCalculation} displayMode={displayMode} />
    case PAYMENT_STATEMENT_ISSUANCE_IDS.tableCalcLines:
    case PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableCalcLines:
      return <CalculationLinesParagraph lines={values?.calculationLines} />
    case PAYMENT_STATEMENT_ISSUANCE_IDS.tableWorkLog:
    case PAYMENT_STATEMENT_PRE_CONSENT_IDS.tableWorkLog:
      return <WorkLogParagraph />
    case SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableBasic:
      return <BasicInfoParagraph values={values?.basicInfo} displayMode={displayMode} />
    case SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableCalcInfo:
      return (
        <LectureFeeCalculationParagraph
          values={values?.lectureFeeCalculation}
          displayMode={displayMode}
          feeLayout="settlement_application"
        />
      )
    case SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableTransport:
      return (
        <>
          <TransportFeeApplicationParagraph displayMode={displayMode} />
          <SettlementApplicationIssuanceFootnote paragraph={paragraph} />
        </>
      )
    case SETTLEMENT_APPLICATION_ISSUANCE_IDS.tableAccommodation:
      return (
        <>
          <AccommodationFeeApplicationParagraph displayMode={displayMode} />
          <SettlementApplicationIssuanceFootnote paragraph={paragraph} />
        </>
      )
    default:
      return null
  }
}
