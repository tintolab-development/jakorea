/**
 * BI 소개 관리 도메인 타입
 */

export type JaKoreaBi = {
  title: string
  mainText: string
  subText: string
  updatedAt: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  version: number
}
