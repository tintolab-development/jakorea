/**
 * 로그 관리 React Query key — Swagger `프론트 조회 키`와 정렬
 */
export const logsQueryKeys = {
  all: ['cms', 'logs'] as const,
  /** URL 쿼리 문자열 — `URLSearchParams` 참조가 아닌 내용으로 캐시·재조회 분기 */
  fileAccess: (searchParamsKey: string) =>
    [...logsQueryKeys.all, 'get_api_logs_file-access', searchParamsKey] as const,
  privacyAccessAll: () => [...logsQueryKeys.all, 'get_api_logs_privacy-access'] as const,
  privacyAccess: (searchParamsKey: string) =>
    [...logsQueryKeys.privacyAccessAll(), searchParamsKey] as const,
  memberLogins: (searchParamsKey: string) =>
    [...logsQueryKeys.all, 'get_api_logs_member-logins', searchParamsKey] as const,
  systemIssuesAll: () => [...logsQueryKeys.all, 'get_api_logs_system-issues'] as const,
  systemIssues: (searchParamsKey: string) =>
    [...logsQueryKeys.systemIssuesAll(), searchParamsKey] as const,
} as const
