/** 작성·발급 풀모달 위 사용자 미리보기 — URL 히스토리 스택과 동기화 */
export const TEMPLATE_USER_PREVIEW_QUERY_KEY = 'userPreview'
export const TEMPLATE_USER_PREVIEW_ACTIVE = '1'

/** 작성 양식 > 동의 전용 풀페이지(`AgreementWritingFormShell`) — URL `userPreview` 부트스트랩·스트립 예외에 사용 */
export const AGREEMENT_WRITING_FORM_SHELL_TEMPLATE_IDS = new Set([
  'agreement-third-party',
  'agreement-notice',
  'agreement-expense',
  'agreement-portrait',
])
