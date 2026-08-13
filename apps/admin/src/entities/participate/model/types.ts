/**
 * 참여하기 — 메뉴 연결 링크 도메인
 */

export type ParticipateLinkKey = 'onlineLearning' | 'alumni'

export type ParticipateMenuLinks = {
  /** 온라인 학습 행 id (remote 고정 1). mock도 동일 */
  onlineLearningId: number
  /** 온라인 학습 외부 URL — 빈 문자열 허용 */
  onlineLearningUrl: string
  /** 낙관적 잠금 (remote 필수). mock은 0 */
  onlineLearningVersion: number
  /** Alumni 행 id (remote 고정 2) */
  alumniId: number
  /** Alumni 외부 URL */
  alumniUrl: string
  alumniVersion: number
  updatedAt: string
}
