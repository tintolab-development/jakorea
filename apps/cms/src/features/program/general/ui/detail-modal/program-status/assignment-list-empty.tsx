/**
 * 일반 프로그램(기관형) 참여 강사·봉사자 상세 — 배정된/배정 대기 기관 목록 빈 상태 (Figma 06-2/07 · 07-2/07)
 * 제목 + 보조문구 2줄 구성. 박스 스킨은 기존 `school-detail-fullpage-view__instructor-list-empty`를 그대로 쓴다.
 */

import './assignment-list-empty.css'

export interface AssignmentListEmptyProps {
  title: string
  description: string
  ariaLabel?: string
}

export const ASSIGNED_INSTITUTIONS_EMPTY_COPY = {
  title: '배정된 기관이 없습니다.',
  description: '기관에 배정되면 이곳에 목록이 표시됩니다.',
} as const

export const WAITING_INSTITUTIONS_EMPTY_COPY = {
  title: '배정 대기 중인 기관이 없습니다.',
  description: '기관 신청 시 이곳에 목록이 표시됩니다.',
} as const

export function AssignmentListEmpty({ title, description, ariaLabel }: AssignmentListEmptyProps) {
  return (
    <div
      className="school-detail-fullpage-view__instructor-list-empty assignment-list-empty"
      role="status"
      aria-label={ariaLabel ?? title}
    >
      <span className="assignment-list-empty__title">{title}</span>
      <span className="assignment-list-empty__description">{description}</span>
    </div>
  )
}
