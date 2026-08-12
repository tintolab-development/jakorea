/**
 * 지급조서(발급용) — 「지급조서」 기본 정보 블록 본문.
 * DetailInfoForm 격자 + 기본은 비활성 입력(발급 시 자동 기입 가정).
 * `onlyPaymentPurposeLocked`: 템플릿 편집(지급조서 사전 동의 등)에서 지급 목적만 잠그고 나머지는 편집 가능.
 */

import { useEffect, useMemo, useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { PaymentStatementIssuanceParagraphDisplayMode } from '@/features/template/ui/form-set/payment-statement-issuance/display-mode'
import { AddressSearch } from '@/shared/ui/address-search'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import './payment-statement-basic-info-detail-form.css'

/** 발급·미리보기에서 채울 값. CMS 템플릿 편집기에서는 비워 두고 placeholder만 노출할 수 있음 */
export type PaymentStatementBasicInfoAutofillValues = {
  nameKo: string
  nameEn: string
  residentFront: string
  residentBack: string
  affiliation: string
  noAffiliation: boolean
  addressRoad: string
  addressDetail: string
  bankName: string
  accountNumber: string
  accountHolder: string
  paymentPurpose: string
}

const EMPTY: PaymentStatementBasicInfoAutofillValues = {
  nameKo: '',
  nameEn: '',
  residentFront: '',
  residentBack: '',
  affiliation: '',
  noAffiliation: false,
  addressRoad: '',
  addressDetail: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  paymentPurpose: '',
}

/** 발급·미리보기 목 데이터 등 레거시 코드값 표시용 */
const LEGACY_BANK_LABELS: Record<string, string> = {
  kb: 'KB국민은행',
  shinhan: '신한은행',
  woori: '우리은행',
  hana: '하나은행',
}

const LEGACY_AFFILIATION_LABELS: Record<string, string> = {
  school: '○○고등학교',
  org: '○○기관',
}

const PAYMENT_STATEMENT_ADDRESS_SEARCH_MODAL_Z_INDEX = 1300

export type PaymentStatementBasicInfoDetailFormProps = {
  values?: Partial<PaymentStatementBasicInfoAutofillValues>
  className?: string
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
  /**
   * true: 편집 모드에서 성명·주소 등은 입력 가능, 「지급 목적」만 비활성(고정 문구).
   * false: 발급용과 같이 전 필드 비활성.
   */
  onlyPaymentPurposeLocked?: boolean
  /** 편집 가능 모드에서 값 변경 시 (확인·서명란 성명 동기화 등) */
  onValuesChange?: (values: PaymentStatementBasicInfoAutofillValues) => void
}

function textOrDash(value: string): string {
  return value.trim() || '-'
}

function displayBankName(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '-'
  return LEGACY_BANK_LABELS[trimmed] ?? trimmed
}

function displayAffiliation(value: string, noAffiliation: boolean): string {
  if (noAffiliation) return '소속 없음'
  const trimmed = value.trim()
  if (!trimmed) return '-'
  return LEGACY_AFFILIATION_LABELS[trimmed] ?? trimmed
}

export function PaymentStatementBasicInfoDetailForm({
  values: valuesProp,
  className,
  displayMode = 'editor',
  onlyPaymentPurposeLocked = false,
  onValuesChange,
}: PaymentStatementBasicInfoDetailFormProps) {
  const isDocumentMode = displayMode === 'document'
  const merged = useMemo(() => ({ ...EMPTY, ...valuesProp }), [valuesProp])
  const editable = onlyPaymentPurposeLocked && !isDocumentMode
  const [local, setLocal] = useState<PaymentStatementBasicInfoAutofillValues>(() => merged)
  useEffect(() => {
    if (editable) setLocal(merged)
  }, [editable, merged])

  const v = editable ? local : merged
  const allAutofillLocked = !editable
  const patch = (next: Partial<PaymentStatementBasicInfoAutofillValues>) => {
    if (!editable) return
    setLocal(prev => {
      const updated = { ...prev, ...next }
      onValuesChange?.(updated)
      return updated
    })
  }

  const rowDash = <span className="payment-statement-basic-info-detail-form__dash">-</span>
  const residentNumber = [v.residentFront, v.residentBack].filter(Boolean).join('-')
  const affiliationText = displayAffiliation(v.affiliation, v.noAffiliation)
  const addressText = [v.addressRoad, v.addressDetail].filter(Boolean).join(' ')
  const accountText = [displayBankName(v.bankName), v.accountNumber, v.accountHolder]
    .filter(part => part && part !== '-')
    .join(' · ')

  return (
    <DetailInfoForm
      title="지급조서 기본 정보"
      hideHeader
      mode={isDocumentMode ? 'view' : 'edit'}
      className={['payment-statement-basic-info-detail-form', className].filter(Boolean).join(' ')}
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="성명"
          view={textOrDash(v.nameKo)}
          edit={
            <CmsInput
              disabled={allAutofillLocked}
              inputSize="large"
              placeholder="한글 성명"
              value={v.nameKo}
              onChange={e => patch({ nameKo: e.target.value })}
              width="100%"
              aria-label="한글 성명 (발급 시 자동 입력)"
            />
          }
        />
        <DetailInfoForm.Field
          label="영문 성명"
          view={textOrDash(v.nameEn)}
          edit={
            <CmsInput
              disabled={allAutofillLocked}
              inputSize="large"
              placeholder="영문 성명"
              value={v.nameEn}
              onChange={e => patch({ nameEn: e.target.value })}
              width="100%"
              aria-label="영문 성명 (발급 시 자동 입력)"
            />
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="주민등록번호"
          view={textOrDash(residentNumber)}
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap payment-statement-basic-info-detail-form__resident">
              <CmsNumericInput
                mode="numericText"
                disabled={allAutofillLocked}
                inputSize="large"
                placeholder="주민등록 앞 6자리"
                value={v.residentFront}
                onValueChange={value => patch({ residentFront: value })}
                maxLength={6}
                width="100%"
                aria-label="주민등록번호 앞자리"
              />
              {rowDash}
              <CmsNumericInput
                mode="numericText"
                disabled={allAutofillLocked}
                inputSize="large"
                placeholder="주민등록 뒤 7자리"
                value={v.residentBack}
                onValueChange={value => patch({ residentBack: value })}
                maxLength={7}
                width="100%"
                aria-label="주민등록번호 뒷자리"
              />
            </div>
          }
        />
        <DetailInfoForm.Field
          label="소속"
          view={affiliationText}
          edit={
            <div className="detail-info-form-inputs-wrapper payment-statement-basic-info-detail-form__affiliation">
              <CmsInput
                disabled={allAutofillLocked || v.noAffiliation}
                inputSize="medium"
                placeholder="소속 기관명"
                value={v.affiliation}
                onChange={e => patch({ affiliation: e.target.value })}
                width="100%"
                style={{ flex: '1 1 0', minWidth: 0 }}
                aria-label="소속 (발급 시 자동 입력)"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsCheckbox
                disabled={allAutofillLocked}
                checked={v.noAffiliation}
                onChange={e =>
                  patch({
                    noAffiliation: e.target.checked,
                    ...(e.target.checked ? { affiliation: '' } : {}),
                  })
                }
                checkboxSize="large"
              >
                소속 없음
              </CmsCheckbox>
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="자택 주소"
          fullRow
          view={textOrDash(addressText)}
          edit={
            <div className="detail-info-form-inputs-wrapper payment-statement-basic-info-detail-form__address">
              {editable ? (
                <AddressSearch
                  value={v.addressRoad}
                  onChange={next => patch({ addressRoad: next })}
                  placeholder="건물명, 도로명 또는 지번"
                  inputSize="large"
                  width="100%"
                  disabled={allAutofillLocked}
                  className="payment-statement-basic-info-detail-form__address-search"
                  modalZIndex={PAYMENT_STATEMENT_ADDRESS_SEARCH_MODAL_Z_INDEX}
                />
              ) : (
                <CmsInput
                  disabled={allAutofillLocked}
                  inputSize="large"
                  placeholder="건물명, 도로명 또는 지번"
                  value={v.addressRoad}
                  onChange={e => patch({ addressRoad: e.target.value })}
                  width="100%"
                  style={{ flex: '1.2 1 0', minWidth: 0 }}
                  aria-label="도로명·지번 주소 (발급 시 자동 입력)"
                />
              )}
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                disabled={allAutofillLocked}
                inputSize="large"
                placeholder="상세 주소"
                value={v.addressDetail}
                onChange={e => patch({ addressDetail: e.target.value })}
                width="100%"
                style={{ flex: '1 1 0', minWidth: 0 }}
                aria-label="상세 주소 (발급 시 자동 입력)"
              />
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="정산 계좌 정보"
          fullRow
          view={textOrDash(accountText)}
          edit={
            <div className="detail-info-form-inputs-wrapper payment-statement-basic-info-detail-form__account">
              <CmsInput
                disabled={allAutofillLocked}
                inputSize="medium"
                placeholder="은행명"
                value={v.bankName}
                onChange={e => patch({ bankName: e.target.value })}
                width="100%"
                aria-label="은행명 (발급 시 자동 입력)"
              />
              <CmsNumericInput
                mode="numericText"
                disabled={allAutofillLocked}
                inputSize="medium"
                placeholder="계좌번호(숫자만)"
                value={v.accountNumber}
                onValueChange={value => patch({ accountNumber: value })}
                width="100%"
                aria-label="계좌번호 (발급 시 자동 입력)"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                disabled={allAutofillLocked}
                inputSize="medium"
                placeholder="예금주명"
                value={v.accountHolder}
                onChange={e => patch({ accountHolder: e.target.value })}
                width="100%"
                aria-label="예금주명 (발급 시 자동 입력)"
              />
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="지급 목적"
          fullRow
          view={textOrDash(v.paymentPurpose)}
          edit={
            <CmsInput
              disabled
              inputSize="large"
              placeholder="강사비 또는 활동비 지급"
              value={v.paymentPurpose}
              width="100%"
              aria-label="지급 목적 (고정 문구)"
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
