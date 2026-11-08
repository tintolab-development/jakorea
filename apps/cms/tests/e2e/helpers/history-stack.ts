import type { Page } from '@playwright/test'
import { expect } from '../fixtures/test'

export async function historyIdx(page: Page): Promise<number> {
  return page.evaluate(() => (window.history.state as { idx?: number } | null)?.idx ?? -1)
}
export async function historyLength(page: Page): Promise<number> {
  return page.evaluate(() => window.history.length)
}
/** null means the parameter must be absent (not an empty string). */
export async function expectSearchParams(page: Page, expected: Record<string, string | null>): Promise<void> {
  await expect(page).toHaveURL(url => Object.entries(expected).every(([key, value]) => url.searchParams.get(key) === value))
}
