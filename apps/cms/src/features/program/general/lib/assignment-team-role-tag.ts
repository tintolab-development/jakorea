import type { AssignmentTeamRoleKey } from '@/features/program/general/model/school-detail-types'

/** 과제 제출·참여자 신청 상세 등 — 팀 역할 StatusDropdownCell 배지 className */
export function assignmentTeamRoleTagClassName(role: AssignmentTeamRoleKey): string {
  const base = 'assignment-submission-modal__team-role-tag'
  if (role === 'leader') return `${base} assignment-submission-modal__team-role-tag--leader`
  if (role === 'individual') return `${base} assignment-submission-modal__team-role-tag--individual`
  return `${base} assignment-submission-modal__team-role-tag--member`
}
