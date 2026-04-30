import {
  LectureFeeCalculationDetailForm,
  type LectureFeeCalculationAutofillValues,
} from '@/features/template/ui/form-set/lecture-fee-calculation-detail-form'

interface LectureFeeCalculationParagraphProps {
  values?: Partial<LectureFeeCalculationAutofillValues>
}

export function LectureFeeCalculationParagraph({ values }: LectureFeeCalculationParagraphProps) {
  return (
    <div className="form-editor-body lecture-fee-calculation-detail-form-host">
      <LectureFeeCalculationDetailForm values={values} />
    </div>
  )
}
