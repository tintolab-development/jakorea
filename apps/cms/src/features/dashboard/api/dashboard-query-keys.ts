/**
 * 대시보드 데이터 fetch용 query key 단일 소스
 * (현재 통계·활동 훅은 useState+useEffect — React Query 전환 시 여기와 맞춤)
 */
export const dashboardQueryKeys = {
  all: ['cms', 'dashboard'] as const,
  overallStatistics: () => [...dashboardQueryKeys.all, 'overall-statistics'] as const,
  instructorActivity: (instructorId: string | undefined) =>
    [...dashboardQueryKeys.all, 'instructor-activity', instructorId ?? 'none'] as const,
} as const
