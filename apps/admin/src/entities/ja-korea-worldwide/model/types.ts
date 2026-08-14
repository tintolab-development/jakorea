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
  /** API numeric id (1–7). mock도 동일 순서 */
  apiId: number
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}

export type JaKoreaWorldwide = {
  branches: WorldwideBranch[]
  bottomText: string
  updatedAt: string
  /** setting row version (remote PUT 필수). mock은 0 */
  settingVersion: number
}
