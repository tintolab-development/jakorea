import type { HistoryEraAlign } from '../model/types.ts'

const ERA_ALIGN: Record<string, HistoryEraAlign> = {
  '1920': 'left',
  '1950': 'right',
  '1960': 'left',
  '1980': 'right',
}

export function historyEraAlign(year: string, index: number): HistoryEraAlign {
  return ERA_ALIGN[year] ?? (index % 2 === 0 ? 'left' : 'right')
}
