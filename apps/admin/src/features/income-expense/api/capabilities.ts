/**
 * 수입&지출 — remote API opt-in
 */
import { shouldUseHomepageRemoteApi } from '@/shared/lib/remote-api-session'

export function shouldUseIncomeExpenseRemoteApi(): boolean {
  return shouldUseHomepageRemoteApi()
}
