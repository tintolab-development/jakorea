/**
 * 지급조서(발급용) — 「강의비 산출 정보」 블록 본문.
 * 지급조서 기본 정보와 동일하게 DetailInfoForm 격자 + 비활성 UI.
 */

import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { CmsInput } from '@/shared/ui/cms-input'
import './lecture-fee-calculation-detail-form.css'

/** 강의비 산출 정보 — 교육 진행 차시 제외 필드 인풋 너비(px), 높이는 medium(40px) */
const LECTURE_FEE_INPUT_WIDTH_PX = 244
/** 교육 진행 차시·시간 인풋 너비(px) */
const LECTURE_FEE_SESSION_INPUT_WIDTH_PX = 221

export type LectureFeeCalculationAutofillValues = {
  lectureFeeType: string
  feeBasisLeft: string
  feeBasisRight: string
  businessIncomeLeft: string
  businessIncomeRight: string
  sessionCount: string
  sessionHours: string
  transportFee: boolean
  lodgingFee: boolean
  totalStudents: string
  totalLectureFee: string
}

const EMPTY: LectureFeeCalculationAutofillValues = {
  lectureFeeType: '',
  feeBasisLeft: '',
  feeBasisRight: '',
  businessIncomeLeft: '',
  businessIncomeRight: '',
  sessionCount: '',
  sessionHours: '',
  transportFee: false,
  lodgingFee: false,
  totalStudents: '',
  totalLectureFee: '',
}

export type LectureFeeCalculationFeeLayout = 'payment_statement' | 'settlement_application'

export type LectureFeeCalculationDetailFormProps = {
  values?: Partial<LectureFeeCalculationAutofillValues>
  className?: string
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
  /** 정산 신청서는 지급 항목·총 학생 수 행 없이 총 강의비만 전행 폭으로 표시 */
  feeLayout?: LectureFeeCalculationFeeLayout
}

function textOrDash(value: string): string {
  return value.trim() || '-'
}

function joinText(parts: string[], separator = ' · '): string {
  const text = parts.filter(part => part.trim().length > 0).join(separator)
  return textOrDash(text)
}

function InlineTextPair({ left, right }: { left: string; right: string }) {
  return (
    <div className="detail-info-form-inputs-wrapper lecture-fee-calculation-detail-form__inline-pair">
      <span className="lecture-fee-calculation-detail-form__text">{left}</span>
      <DetailInfoForm.InputsSeparator />
      <span className="lecture-fee-calculation-detail-form__text">{right}</span>
    </div>
  )
}

function IssuancePaymentItemMark({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="lecture-fee-calculation-detail-form__payment-item-row">
      <span className="lecture-fee-calculation-detail-form__payment-item-label">{label}</span>
      <span
        className="lecture-fee-calculation-detail-form__payment-check-cell"
        aria-hidden="true"
      >
        {checked ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="10"
            viewBox="0 0 12 10"
            fill="none"
            className="lecture-fee-calculation-detail-form__payment-check-svg"
          >
            <path
              opacity="0.2"
              d="M10.1883 0.252684C10.4627 -0.0572855 10.9367 -0.0859769 11.2469 0.188231C11.5568 0.462613 11.5855 0.93661 11.3113 1.24682L4.43633 9.02417C4.29397 9.18512 4.08969 9.2771 3.87481 9.2771C3.65992 9.2771 3.45564 9.18512 3.31328 9.02417L0.188283 5.48901C-0.0859598 5.17876 -0.057344 4.70478 0.252736 4.43042C0.563086 4.15609 1.037 4.1855 1.31133 4.49585L3.87383 7.39526L10.1883 0.252684Z"
              fill="#22404B"
            />
          </svg>
        ) : null}
      </span>
    </div>
  )
}

export function LectureFeeCalculationDetailForm({
  values: valuesProp,
  className,
  displayMode = 'editor',
  feeLayout = 'payment_statement',
}: LectureFeeCalculationDetailFormProps) {
  const v = { ...EMPTY, ...valuesProp }
  const isDocumentMode = displayMode === 'document'
  const isSettlementLayout = feeLayout === 'settlement_application'
  const paymentItems = [
    v.transportFee ? '교통비' : '',
    v.lodgingFee ? '숙박비' : '',
  ]

  return (
    <DetailInfoForm
      title="강의비 산출 정보"
      hideHeader
      mode={isDocumentMode ? 'view' : 'edit'}
      className={['lecture-fee-calculation-detail-form', className].filter(Boolean).join(' ')}
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="강의비 유형"
          view={textOrDash(v.lectureFeeType)}
          edit={
            <CmsInput
              disabled
              inputSize="medium"
              value={v.lectureFeeType}
              width={LECTURE_FEE_INPUT_WIDTH_PX}
              aria-label="강의비 유형 (발급 시 자동 입력)"
            />
          }
        />
        <DetailInfoForm.Field
          label="강사비 책정"
          view={joinText([v.feeBasisLeft, v.feeBasisRight])}
          edit={<InlineTextPair left={v.feeBasisLeft} right={v.feeBasisRight} />}
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="사업소득자 여부"
          view={joinText([v.businessIncomeLeft, v.businessIncomeRight])}
          edit={
            <InlineTextPair left={v.businessIncomeLeft} right={v.businessIncomeRight} />
          }
        />
        <DetailInfoForm.Field
          label="교육 진행 차시"
          view={joinText([v.sessionCount, v.sessionHours])}
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap lecture-fee-calculation-detail-form__session">
              <CmsInput
                disabled
                inputSize="medium"
                placeholder="진행 차시"
                value={v.sessionCount}
                width={LECTURE_FEE_SESSION_INPUT_WIDTH_PX}
                aria-label="교육 진행 차시"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                disabled
                inputSize="medium"
                placeholder="시간"
                value={v.sessionHours}
                width={LECTURE_FEE_SESSION_INPUT_WIDTH_PX}
                aria-label="교육 진행 시간"
              />
            </div>
          }
        />
      </DetailInfoForm.Row>

      {!isSettlementLayout ? (
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급 항목 여부"
            view={joinText(paymentItems)}
            edit={
              <div className="detail-info-form-inputs-wrapper lecture-fee-calculation-detail-form__payment-items">
                <IssuancePaymentItemMark checked={v.transportFee} label="교통비" />
                <IssuancePaymentItemMark checked={v.lodgingFee} label="숙박비" />
              </div>
            }
          />
          <DetailInfoForm.Field
            label="총 학생 수"
            view={textOrDash(v.totalStudents ? `${v.totalStudents}명` : '')}
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap lecture-fee-calculation-detail-form__student-count">
                <CmsInput
                  disabled
                  inputSize="medium"
                  value={v.totalStudents}
                  width={LECTURE_FEE_INPUT_WIDTH_PX}
                  aria-label="총 학생 수"
                />
                <span className="lecture-fee-calculation-detail-form__suffix">명</span>
              </div>
            }
          />
        </DetailInfoForm.Row>
      ) : null}

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="총 강의비"
          colSpan={2}
          view={textOrDash(v.totalLectureFee ? `${v.totalLectureFee}원` : '')}
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap lecture-fee-calculation-detail-form__total-fee">
              <CmsInput
                disabled
                inputSize="medium"
                value={v.totalLectureFee}
                width={LECTURE_FEE_INPUT_WIDTH_PX}
                aria-label="총 강의비"
              />
              <span className="lecture-fee-calculation-detail-form__suffix">원</span>
            </div>
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
