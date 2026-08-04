import type { IntegrationStatus, SurfaceRow } from '../data/types'

export function statusToCompletion(status: IntegrationStatus, documentedPct: number): number {
  if (status === 'n-a') return documentedPct
  if (status === 'mock-only') return Math.min(documentedPct, 15)
  if (status === 'api-wired') return Math.max(documentedPct, 95)
  return documentedPct
}

/** Weighted average of surface completionPct */
export function computeSurfaceRates(surfaces: readonly SurfaceRow[]): {
  apiPct: number
  dummyPct: number
  mockOnlyCount: number
  hybridCount: number
  wiredCount: number
  totalWeight: number
} {
  if (surfaces.length === 0) {
    return {
      apiPct: 0,
      dummyPct: 100,
      mockOnlyCount: 0,
      hybridCount: 0,
      wiredCount: 0,
      totalWeight: 0,
    }
  }

  let weightedSum = 0
  let totalWeight = 0
  let mockOnlyCount = 0
  let hybridCount = 0
  let wiredCount = 0

  for (const row of surfaces) {
    const w = row.weight ?? 1
    const pct = statusToCompletion(row.status, row.completionPct)
    weightedSum += pct * w
    totalWeight += w
    if (row.status === 'mock-only') mockOnlyCount += 1
    else if (row.status === 'hybrid') hybridCount += 1
    else if (row.status === 'api-wired') wiredCount += 1
  }

  const apiPct = totalWeight === 0 ? 0 : Math.round(weightedSum / totalWeight)
  return {
    apiPct,
    dummyPct: Math.max(0, 100 - apiPct),
    mockOnlyCount,
    hybridCount,
    wiredCount,
    totalWeight,
  }
}

export function integrationStatusLabel(status: IntegrationStatus): string {
  switch (status) {
    case 'api-wired':
      return 'API-wired'
    case 'hybrid':
      return 'hybrid'
    case 'mock-only':
      return 'mock-only'
    case 'n-a':
      return 'N/A'
  }
}
