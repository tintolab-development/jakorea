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
import { CmsResidentBackInput } from '@/shared/ui/cms-resident-back-input'
import {
  formatResidentNumberForPreview,
  mergePaymentStatementBasicInfo,
} from '@jakorea/form-schema/consent'
import { RestrictedPiiClickable } from '@/features/user/detail/ui/restricted-pii-clickable'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
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

const EMPTY: PaymentStatementBasicInfoAutofillValues = mergePaymentStatementBasicInfo()

const LEGACY_AFFILIATION_LABELS: Record<string, string> = {
  school: '○○고등학교',
  org: '○○기관',
}

const PAYMENT_STATEMENT_ADDRESS_SEARCH_MODAL_Z_INDEX = 1300

/** 발급 양식(지급조서·정산 신청서) 템플릿 편집 — 시안 5767:46455·5767:44580 입력 폭 */
const ISSUANCE_TEMPLATE_INPUT_W = {
  name: 200,
  resident: 200,
  affiliation: 200,
  address: 240,
  bank: 120,
  account: 200,
  holder: 120,
  paymentPurpose: 240,
} as const

/** 지급조서·영수증 사전 동의서 템플릿 편집 — 시안 5767:42072·16046:109928 입력 폭 */
const PRE_CONSENT_TEMPLATE_INPUT_W = {
  name: 200,
  resident: 200,
  affiliation: 200,
  address: 240,
  bank: 120,
  account: 200,
  holder: 120,
} as const

/** 발급 양식 편집기 레이아웃 — 지급조서(발급용)·정산 신청서 */
export type PaymentStatementBasicInfoIssuanceLayout = 'payment_statement' | 'settlement_application'

export type PaymentStatementBasicInfoDetailFormProps = {
  values?: Partial<PaymentStatementBasicInfoAutofillValues>
  className?: string
  displayMode?: PaymentStatementIssuanceParagraphDisplayMode
  /**
   * true: 편집 모드에서 성명·주소 등은 입력 가능, 「지급 목적」만 비활성(고정 문구).
   * false: 발급용과 같이 전 필드 비활성.
   */
  onlyPaymentPurposeLocked?: boolean
  /**
   * CMS 강사 신규 등록 fill — 성명·소속·자택 주소는 등록 기본정보 연동·비활성.
   * 영문 성명·주민등록번호·정산 계좌는 계속 입력.
   */
  lockedProfileFields?: boolean
  /** 영수증 발급 사전 동의서 — 주민등록번호·소속 미노출 */
  hideResidentFields?: boolean
  /** 편집 가능 모드에서 값 변경 시 (확인·서명란 성명 동기화 등) */
  onValuesChange?: (values: PaymentStatementBasicInfoAutofillValues) => void
  /**
   * 발급 양식 편집기(지급조서·정산 신청서). 템플릿 관리 화면에서만 시안 폭·자리 표시·라벨을 쓴다.
   * 정산 신청서는 「소속 없음」 미노출·지급 목적 전체 폭(시안 5767:44580).
   */
  issuanceLayout?: PaymentStatementBasicInfoIssuanceLayout
}

function textOrDash(value: string): string {
  return value.trim() || '-'
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
  lockedProfileFields = false,
  hideResidentFields = false,
  onValuesChange,
  issuanceLayout,
}: PaymentStatementBasicInfoDetailFormProps) {
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const isDocumentMode = displayMode === 'document'
  /** 템플릿 관리 > 발급 양식 편집기 전용 — 프로그램·동의서 화면은 기존 레이아웃 유지 */
  const issuanceTemplate =
    issuanceLayout != null &&
    isTemplateManagementScreen &&
    !isDocumentMode &&
    !onlyPaymentPurposeLocked &&
    !lockedProfileFields &&
    !hideResidentFields
  const isSettlementIssuanceTemplate =
    issuanceTemplate && issuanceLayout === 'settlement_application'
  const iw = issuanceTemplate ? ISSUANCE_TEMPLATE_INPUT_W : null
  /**
   * 템플릿 관리 > 지급조서·영수증 사전 동의서 편집기 — 시안 5767:42072·16046:109928.
   * 마이페이지에서 불러오는 성명·소속·주소는 비활성, 입력 폭 고정, 「소속 없음」 미노출.
   * 회원 작성 팝업·발급 양식 화면은 기존 그대로.
   */
  const preConsentTemplate =
    isTemplateManagementScreen &&
    onlyPaymentPurposeLocked &&
    !isDocumentMode &&
    issuanceLayout == null
  const pw = preConsentTemplate ? PRE_CONSENT_TEMPLATE_INPUT_W : null
  const merged = useMemo(
    () => mergePaymentStatementBasicInfo({ ...EMPTY, ...valuesProp }),
    [valuesProp]
  )
  const editable = onlyPaymentPurposeLocked && !isDocumentMode
  const [local, setLocal] = useState<PaymentStatementBasicInfoAutofillValues>(() => merged)
  useEffect(() => {
    if (editable) setLocal(merged)
  }, [editable, merged])

  useEffect(() => {
    if (!editable || !onValuesChange) return
    if ((valuesProp?.paymentPurpose ?? '').trim()) return
    onValuesChange(merged)
  }, [editable, merged, onValuesChange, valuesProp?.paymentPurpose])

  const profileLocked = (lockedProfileFields || preConsentTemplate) && !isDocumentMode
  const v = {
    ...(editable ? local : merged),
    ...(profileLocked
      ? {
          nameKo: merged.nameKo,
          affiliation: merged.affiliation,
          noAffiliation: merged.noAffiliation,
          addressRoad: merged.addressRoad,
          addressDetail: merged.addressDetail,
        }
      : {}),
  }
  const allAutofillLocked = !editable
  const profileFieldLocked = allAutofillLocked || profileLocked
  const patch = (next: Partial<PaymentStatementBasicInfoAutofillValues>) => {
    if (!editable) return
    const allowed = profileLocked
      ? {
          ...(next.nameEn != null ? { nameEn: next.nameEn } : {}),
          ...(next.residentFront != null ? { residentFront: next.residentFront } : {}),
          ...(next.residentBack != null ? { residentBack: next.residentBack } : {}),
          ...(next.bankName != null ? { bankName: next.bankName } : {}),
          ...(next.accountNumber != null ? { accountNumber: next.accountNumber } : {}),
          ...(next.accountHolder != null ? { accountHolder: next.accountHolder } : {}),
          ...(next.paymentPurpose != null ? { paymentPurpose: next.paymentPurpose } : {}),
        }
      : next
    if (Object.keys(allowed).length === 0) return
    setLocal(prev => {
      const updated = {
        ...prev,
        ...allowed,
        ...(profileLocked
          ? {
              nameKo: merged.nameKo,
              affiliation: merged.affiliation,
              noAffiliation: merged.noAffiliation,
              addressRoad: merged.addressRoad,
              addressDetail: merged.addressDetail,
            }
          : {}),
      }
      onValuesChange?.(updated)
      return updated
    })
  }

  const rowDash = <span className="payment-statement-basic-info-detail-form__dash">-</span>
  const residentNumber = formatResidentNumberForPreview(v.residentFront, v.residentBack)
  const affiliationText = displayAffiliation(v.affiliation, v.noAffiliation)
  const addressText = [v.addressRoad, v.addressDetail].filter(Boolean).join(' ')
  const accountText = [textOrDash(v.bankName), v.accountNumber, v.accountHolder]
    .filter(part => part && part !== '-')
    .join(' · ')

  const renderAffiliationField = (fullRow: boolean) => (
    <DetailInfoForm.Field
      label="소속"
      fullRow={fullRow}
      view={affiliationText}
      edit={
        <div className="detail-info-form-inputs-wrapper payment-statement-basic-info-detail-form__affiliation">
          <CmsInput
            disabled={profileFieldLocked || v.noAffiliation}
            inputSize="small"
            placeholder={issuanceTemplate || preConsentTemplate ? '소속' : '소속 기관명'}
            value={v.affiliation}
            onChange={e => patch({ affiliation: e.target.value })}
            width={iw?.affiliation ?? pw?.affiliation ?? '100%'}
            style={iw || pw ? undefined : { flex: '1 1 0', minWidth: 0 }}
            aria-label="소속 (발급 시 자동 입력)"
          />
          {isSettlementIssuanceTemplate || preConsentTemplate ? null : (
            <>
              <DetailInfoForm.InputsSeparator />
              <CmsCheckbox
                disabled={profileFieldLocked}
                checked={v.noAffiliation}
                onChange={e =>
                  patch({
                    noAffiliation: e.target.checked,
                    ...(e.target.checked ? { affiliation: '' } : {}),
                  })
                }
                checkboxSize="medium"
              >
                소속 없음
              </CmsCheckbox>
            </>
          )}
        </div>
      }
    />
  )

  return (
    <DetailInfoForm
      title="지급조서 기본 정보"
      hideHeader
      mode={isDocumentMode ? 'view' : 'edit'}
      className={[
        'payment-statement-basic-info-detail-form',
        issuanceTemplate || preConsentTemplate
          ? 'payment-statement-basic-info-detail-form--issuance-template'
          : '',
        preConsentTemplate ? 'payment-statement-basic-info-detail-form--pre-consent-template' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="성명"
          view={textOrDash(v.nameKo)}
          edit={
            <CmsInput
              disabled={profileFieldLocked}
              inputSize="small"
              placeholder={issuanceTemplate ? '성명' : '한글 성명'}
              value={v.nameKo}
              onChange={e => patch({ nameKo: e.target.value })}
              width={iw?.name ?? pw?.name ?? '100%'}
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
              inputSize="small"
              placeholder="영문 성명"
              value={v.nameEn}
              onChange={e => patch({ nameEn: e.target.value })}
              width={iw?.name ?? pw?.name ?? '100%'}
              aria-label="영문 성명 (발급 시 자동 입력)"
            />
          }
        />
      </DetailInfoForm.Row>

      {hideResidentFields ? null : (
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="주민등록번호"
          view={
            <RestrictedPiiClickable action="piiRrn">
              {textOrDash(residentNumber)}
            </RestrictedPiiClickable>
          }
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap payment-statement-basic-info-detail-form__resident">
              <CmsNumericInput
                mode="numericText"
                disabled={allAutofillLocked}
                inputSize="small"
                placeholder="주민등록 앞 6자리"
                value={v.residentFront}
                onValueChange={value => patch({ residentFront: value })}
                maxLength={6}
                width={iw?.resident ?? pw?.resident ?? '100%'}
                aria-label="주민등록번호 앞자리"
              />
              {rowDash}
              <CmsResidentBackInput
                disabled={allAutofillLocked}
                inputSize="small"
                placeholder={issuanceTemplate ? '주민등록 뒷 7자리' : '주민등록 뒤 7자리'}
                value={v.residentBack}
                onValueChange={value => patch({ residentBack: value })}
                width={iw?.resident ?? pw?.resident ?? '100%'}
                aria-label="주민등록번호 뒷자리"
              />
            </div>
          }
        />
        {renderAffiliationField(false)}
      </DetailInfoForm.Row>
      )}
      {/* 영수증 사전 동의서(주민번호 없음) — 시안 16046:109928은 소속 단독 행 */}
      {hideResidentFields && preConsentTemplate ? (
        <DetailInfoForm.Row type="single">{renderAffiliationField(true)}</DetailInfoForm.Row>
      ) : null}

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label={issuanceTemplate ? '자택 주소' : '자택 주소지'}
          fullRow
          view={textOrDash(addressText)}
          edit={
            <div className="detail-info-form-inputs-wrapper payment-statement-basic-info-detail-form__address">
              {preConsentTemplate ? (
                // 시안: 검색 아이콘이 있는 비활성 주소 칸(240)
                <AddressSearch
                  value={v.addressRoad}
                  onChange={() => {}}
                  placeholder="건물명, 도로명 또는 지번"
                  inputSize="small"
                  width={pw?.address}
                  disabled
                  className="payment-statement-basic-info-detail-form__address-search"
                  modalZIndex={PAYMENT_STATEMENT_ADDRESS_SEARCH_MODAL_Z_INDEX}
                />
              ) : editable && !profileLocked ? (
                <AddressSearch
                  value={v.addressRoad}
                  onChange={next => patch({ addressRoad: next })}
                  placeholder="건물명, 도로명 또는 지번"
                  inputSize="small"
                  width="auto"
                  disabled={allAutofillLocked}
                  className="payment-statement-basic-info-detail-form__address-search"
                  modalZIndex={PAYMENT_STATEMENT_ADDRESS_SEARCH_MODAL_Z_INDEX}
                />
              ) : (
                <CmsInput
                  disabled={profileFieldLocked}
                  inputSize="small"
                  placeholder="건물명, 도로명 또는 지번"
                  value={v.addressRoad}
                  onChange={e => patch({ addressRoad: e.target.value })}
                  width={iw?.address ?? 'auto'}
                  aria-label="도로명·지번 주소 (발급 시 자동 입력)"
                />
              )}
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                disabled={profileFieldLocked}
                inputSize="small"
                placeholder="상세 주소"
                value={v.addressDetail}
                onChange={e => patch({ addressDetail: e.target.value })}
                width={iw?.address ?? pw?.address ?? 'auto'}
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
                inputSize="small"
                placeholder="은행명"
                width={iw?.bank ?? pw?.bank ?? 200}
                value={v.bankName}
                onChange={e => patch({ bankName: e.target.value })}
                aria-label="은행명 (발급 시 자동 입력)"
              />
              {issuanceTemplate || preConsentTemplate ? <DetailInfoForm.InputsSeparator /> : null}
              <CmsNumericInput
                mode="numericText"
                disabled={allAutofillLocked}
                inputSize="small"
                placeholder={issuanceTemplate ? '계좌번호' : '계좌번호(숫자만)'}
                value={v.accountNumber}
                onValueChange={value => patch({ accountNumber: value })}
                width={iw?.account ?? pw?.account ?? 200}
                aria-label="계좌번호 (발급 시 자동 입력)"
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                disabled={allAutofillLocked}
                inputSize="small"
                placeholder="예금주명"
                value={v.accountHolder}
                onChange={e => patch({ accountHolder: e.target.value })}
                width={iw?.holder ?? pw?.holder ?? 200}
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
              inputSize="small"
              placeholder="강사비 지급"
              value={v.paymentPurpose}
              width={iw != null && !isSettlementIssuanceTemplate ? iw.paymentPurpose : '100%'}
              aria-label="지급 목적 (고정 문구)"
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
