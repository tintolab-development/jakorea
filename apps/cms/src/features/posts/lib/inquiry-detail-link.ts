/**
 * 문의 관리 — 특정 문의 상세를 여는 URL.
 * 알림 「신규 문의 접수」의 [문의 내용 확인](시안 17149:68716)이 쓴다.
 * 목록 화면이 이 값을 읽어 상세를 연 뒤 URL에서 지운다(목록 필터 URL과 섞이지 않게).
 */

export const ADMIN_INQUIRIES_PATH = '/admin/posts/inquiries'

export const INQUIRY_DETAIL_ID_PARAM = 'inquiryId'

export function buildInquiryDetailPath(inquiryId: string): string {
  const params = new URLSearchParams({ [INQUIRY_DETAIL_ID_PARAM]: inquiryId })
  return `${ADMIN_INQUIRIES_PATH}?${params.toString()}`
}
