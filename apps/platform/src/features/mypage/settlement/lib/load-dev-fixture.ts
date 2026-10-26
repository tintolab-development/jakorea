import type { SettlementOverviewPageData } from '../model/types.ts'

export async function loadDevSettlementFixture(): Promise<SettlementOverviewPageData | null> {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    if (new URLSearchParams(window.location.search).get('fixture') !== '1') return null
    const mod = await import('./fixture.ts')
    return mod.SETTLEMENT_OVERVIEW_FIXTURE
  }
  return null
}
