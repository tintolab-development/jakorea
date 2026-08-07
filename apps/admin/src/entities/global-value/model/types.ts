/**
 * JA Global Value 도메인 타입
 * 관리 항목은 고정 5종 — 신규 추가/삭제 없음
 */

export type GlobalValueKey = 'value_1' | 'value_2' | 'value_3' | 'value_4' | 'value_5'

export type GlobalValue = {
  id: string
  key: GlobalValueKey
  /** 1-based 노출 순서 */
  sortOrder: number
  isActive: boolean
  mainText: string
  subText: string
  /** 고정 아이콘 식별자 — 업로드/변경 없음 */
  iconKey: GlobalValueKey
  updatedAt: string
}

export type GlobalValueTextPatch = {
  id: string
  mainText: string
  subText: string
}
