/**
 * 신청 양식 개인정보 수집·이용 / 제3자 제공 표의 마지막 보유기간 셀.
 *
 * BE `FormTemplateSystemFieldGuard`는 개인정보 표에서 마지막 보유기간 셀만 시스템 값으로 보고
 * canonical seed(`local-demo/form-templates/application-*.json`)와 글자 단위로 같아야 저장·게시를 허용한다.
 * 값이 한 글자라도 다르면 프로그램 등록 시 409 FORM_SCHEMA_IMMUTABLE(PROTECTED_STRUCTURE_CHANGED)로 막힌다.
 * BE도 같은 이름·같은 값의 상수(`com.jakorea.cms.form.service.ApplicationFormPrivacyRetention`)를 두고,
 * `ApplicationFormPrivacyRetentionSeedContractTest`가 BE seed와 그 상수의 일치를 고정한다.
 * 문구를 바꿀 때는 이 파일, BE 상수, BE canonical seed, 카탈로그 DB를 함께 바꿔야 한다.
 */

/** 개인정보 수집·이용 표 보유기간 셀 — 교육 받은 교사 신청서를 제외한 신청서 공통 */
export const APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL =
  '이용 기간: 해당 프로그램이 진행되는 기간\n보유 기간: 동의일로부터 3년 보관 후 폐기'

/** 개인정보 수집·이용 표 보유기간 셀 — 교육 받은 교사 신청서 전용(BE seed가 항목 앞 `- `를 유지) */
export const TRAINED_TEACHERS_APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL =
  '- 이용 기간: 해당 프로그램이 진행되는 기간\n- 보유 기간: 동의일로부터 3년 보관 후 폐기'

/** 개인정보 제3자 제공 표 보유기간 셀 — 신청서 공통 */
export const APPLICATION_FORM_THIRD_PARTY_RETENTION_CELL = '동의일로부터 3년 보관 후 폐기'
