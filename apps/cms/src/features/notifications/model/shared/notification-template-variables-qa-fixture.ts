/**
 * BE local QA 시드 (2026-09-09 handoff).
 * UI·문서·스모크 테스트에서 동일 id를 쓴다. invent 금지 — BE 시드와 불일치하면 BE에 확인.
 */
export const NOTIFICATION_TEMPLATE_VARIABLES_QA_FIXTURE = {
  programId: 164003,
  actorId: 1799401,
  actorType: 'MEMBER' as const,
  memberDisplayName: '이건희',
  /** 시드 스케줄 기준 enrich 기대 문자열(대략). 공백·구분은 BE 포맷을 따른다. */
  expectedClassTimeHint: '10:00 ~ 12:00',
  assignedOrgNameHint: '경기고등학교',
  keys: {
    classTime: '교육 진행 수업 시간',
    assignedOrg: '배정 기관명',
  },
} as const

export type NotificationTemplateVariablesQaFixture =
  typeof NOTIFICATION_TEMPLATE_VARIABLES_QA_FIXTURE
