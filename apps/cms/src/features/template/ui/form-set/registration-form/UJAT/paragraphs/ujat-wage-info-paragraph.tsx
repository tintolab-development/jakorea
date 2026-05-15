import { useMemo, useState } from 'react'
import { getTemplateRegistrationPaymentItemOptions } from '@/features/template/lib/template-registration-payment-item-options'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { AppMultiSelect } from '@/shared/ui/app-multi-select'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** UJAT만: mock 지급 항목 `교통비` (id `p-1`) 기본 선택 */
const UJAT_DEFAULT_PAYMENT_ITEM_VALUES: string[] = ['p-1']

export function UjatWageInfoParagraph() {
  const [paymentItemValues, setPaymentItemValues] = useState<string[]>(() => [...UJAT_DEFAULT_PAYMENT_ITEM_VALUES])
  const paymentItemOptions = useMemo(() => getTemplateRegistrationPaymentItemOptions(), [])

  return (
    <DetailInfoForm
      title="임금 정보"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="지급 항목"
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <AppMultiSelect
                value={paymentItemValues}
                onChange={setPaymentItemValues}
                options={paymentItemOptions}
                placeholder="지급 항목을 선택하세요"
                style={{ width: '100%', minWidth: 0 }}
              />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field label="공제 항목" view="일용근로자 원천징수세액" />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
