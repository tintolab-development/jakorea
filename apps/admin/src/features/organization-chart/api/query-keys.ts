export const organizationChartQueryKeys = {
  all: ['organization-chart'] as const,
  detail: (source: 'remote' | 'local') =>
    [...organizationChartQueryKeys.all, 'detail', source] as const,
}
