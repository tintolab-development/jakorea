/** 게시글(공지·FAQ·문의) 카테고리 관리 모달 테이블 행 */
export type PostsCategoryRow = {
  id: string
  name: string
  /** 서버 동시 수정 검증용 원본 버전. 화면 표시용으로 포맷하지 않는다. */
  updatedAt?: string | null
  /** bulk 저장 시 기존 활성 상태를 보존하기 위한 서버 값 */
  useYn?: boolean | null
  /** bulk 저장 시 기존 정렬 순서를 보존하기 위한 서버 값 */
  displayOrder?: number | null
}
