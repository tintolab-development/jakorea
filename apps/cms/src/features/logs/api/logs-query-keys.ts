/**
 * 로그 관리 React Query key — Swagger `프론트 조회 키`와 정렬
 */
export const logsQueryKeys = {
  all: ['cms', 'logs'] as const,
  fileAccess: (params: Record<string, string>) =>
    [...logsQueryKeys.all, 'get_api_logs_file-access', params] as const,
  privacyAccess: (params: Record<string, string>) =>
    [...logsQueryKeys.all, 'get_api_logs_privacy-access', params] as const,
  systemIssues: (params: Record<string, string>) =>
    [...logsQueryKeys.all, 'get_api_logs_system-issues', params] as const,
  systemIssueDetail: (issueId: number) =>
    [...logsQueryKeys.all, 'get_api_logs_system-issues_issueId', issueId] as const,
} as const
