import type { AdminProgramCalendarQuery } from './program-calendar-api-client'

export const programCalendarQueryKeys = {
  all: ['cms', 'programs', 'calendar'] as const,
  list: (params: AdminProgramCalendarQuery) => [...programCalendarQueryKeys.all, params] as const,
}
