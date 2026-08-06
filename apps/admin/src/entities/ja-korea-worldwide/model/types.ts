/**
 * JA Worldwide 관리 — 단건 문서 모델
 */

export type WorldwideBranchId =
  | 'worldwide'
  | 'usa'
  | 'europe'
  | 'mena'
  | 'asia-pacific'
  | 'americas'
  | 'africa'

export type WorldwideBranch = {
  id: WorldwideBranchId
  /** 고정 라벨 — normalize/UI에서 변경 불가 */
  name: string
  linkUrl: string
}

export type JaKoreaWorldwide = {
  branches: WorldwideBranch[]
  bottomText: string
  updatedAt: string
}
