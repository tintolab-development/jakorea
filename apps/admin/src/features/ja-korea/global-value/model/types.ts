/**
 * JA Global Value — Notion 1-2
 * 항목 5개 고정, 아이콘 수정·삭제 불가
 */

export type GlobalValueId =
  | 'belief'
  | 'connection'
  | 'integrity'
  | 'excellence'
  | 'respect'

export type GlobalValueItem = {
  id: GlobalValueId
  order: number
  active: boolean
  /** 고정 아이콘 키 — 교체 불가 */
  iconKey: GlobalValueId
  mainText: string
  subText: string
}

export const GLOBAL_VALUE_DEFS: ReadonlyArray<{
  id: GlobalValueId
  /** 관리용 라벨(아이콘 대체 텍스트) */
  label: string
}> = [
  { id: 'belief', label: 'Belief' },
  { id: 'connection', label: 'Connection' },
  { id: 'integrity', label: 'Integrity' },
  { id: 'excellence', label: 'Excellence' },
  { id: 'respect', label: 'Respect' },
]
