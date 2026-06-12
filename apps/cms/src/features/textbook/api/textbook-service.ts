/**
 * 교재 API — 데이터 관리 화면은 admin-textbooks-service(실 API 전용)를 사용합니다.
 * 프로그램 등록 폼 등은 아직 textbook-mock-store 목록을 참조합니다.
 */
export {
  createTextbook,
  deleteTextbooks,
  getTextbookDetail,
  getTextbookList,
  updateTextbook,
} from '@/features/textbook/api/admin-textbooks-service'

export { listTextbooks as listTextbooksFromStore } from '@/features/textbook/api/textbook-mock-store'
