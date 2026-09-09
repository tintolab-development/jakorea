/**
 * 지급조서(발급용)·정산 신청서 기본 정보 — 양식 관리 미리보기용.
 * 회원 목 데이터 없이 placeholder만 노출. 지급 목적만 고정 문구.
 */

import { PAYMENT_STATEMENT_DEFAULT_PURPOSE } from '@jakorea/form-schema/consent'
import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'

export const PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES: PaymentStatementBasicInfoAutofillValues = {
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
  paymentPurpose: PAYMENT_STATEMENT_DEFAULT_PURPOSE,
}

/**
 * 지급조서 사전 동의서 authoring/작성 — 입력란은 비우고, 지급 목적만 고정 문구를 값으로 넣는다.
 */
export const PAYMENT_STATEMENT_PRE_CONSENT_BASIC_INFO_AUTHORING_VALUES: Partial<PaymentStatementBasicInfoAutofillValues> =
  {
    paymentPurpose: PAYMENT_STATEMENT_DEFAULT_PURPOSE,
  }
