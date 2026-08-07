/**
 * 참여하기 — 메뉴 연결 링크 도메인
 */

export type ParticipateLinkKey = 'onlineLearning' | 'alumni'

export type ParticipateMenuLinks = {
  /** 온라인 학습 외부 URL — 빈 문자열 허용 */
  onlineLearningUrl: string
  /** Alumni 외부 URL */
  alumniUrl: string
  updatedAt: string
}
