export const organizationChartQueryKeys = {
  all: ['organization-chart'] as const,
  detail: () => [...organizationChartQueryKeys.all, 'detail', 'remote'] as const,
}
