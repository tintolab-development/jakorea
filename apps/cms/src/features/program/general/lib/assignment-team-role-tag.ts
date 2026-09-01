import type { AssignmentTeamRoleKey } from '@/features/program/general/model/school-detail-types'

/** StatusDropdownCell tag100 — 트리거·드롭다운 배지 동일 100px */
export const ASSIGNMENT_TEAM_ROLE_TAG_DROPDOWN_STYLE = {
  width: 100,
  minWidth: 100,
  maxWidth: 100,
} as const

/** 과제 제출·참여자 신청 상세 등 — 팀 역할 StatusDropdownCell 배지 className */
export function assignmentTeamRoleTagClassName(role: AssignmentTeamRoleKey): string {
  const base = 'assignment-submission-modal__team-role-tag'
  if (role === 'leader') return `${base} assignment-submission-modal__team-role-tag--leader`
  if (role === 'individual') return `${base} assignment-submission-modal__team-role-tag--individual`
  return `${base} assignment-submission-modal__team-role-tag--member`
}
