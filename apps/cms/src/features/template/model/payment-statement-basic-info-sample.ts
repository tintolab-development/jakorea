/**
 * 지급조서(발급용) 단락 — 디자인·기능 검증용 목 회원 기본정보.
 * mock 강사(최강사) 스토리와 맞추고, BANK_OPTIONS/AFFILIATION_OPTIONS value 키와 일치시킨다.
 */

import type { PaymentStatementBasicInfoAutofillValues } from '@/features/template/ui/form-set/detail-forms/payment-statement-basic-info-detail-form'

export const PAYMENT_STATEMENT_BASIC_INFO_SAMPLE_VALUES: PaymentStatementBasicInfoAutofillValues =
  {
    nameKo: '최강사',
    nameEn: 'Choi Kang-sa',
    residentFront: '850320',
    residentBack: '1234567',
    affiliation: 'school',
    noAffiliation: false,
    addressRoad: '서울특별시 서초구 서초길 123-22',
    addressDetail: 'JA빌딩 10층',
    bankName: 'kb',
    accountNumber: '123456789012',
    accountHolder: '최강사',
    paymentPurpose: '강사비 또는 활동비 지급',
  }
