import { expect, test } from '@playwright/test'
import { assertIsolatedNetwork, installTtIsolatedNetwork } from './install-tt-isolated-network'

test.describe('TT 격리 네트워크 가드', () => {
  test('허용되지 않은 외부 HTTP는 차단된다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page)
    await page.goto('/programs/trained-teachers')
    const blocked = await page.evaluate(async () => {
      try {
        await fetch('https://example.com/', { method: 'GET' })
        return false
      } catch {
        return true
      }
    })
    expect(blocked).toBe(true)
    expect(log.blockedExternal.length).toBeGreaterThan(0)
    expect(log.createProgram).toBeNull()
  })

  test('등록되지 않은 API Mutation은 차단된다', async ({ page }) => {
    const log = await installTtIsolatedNetwork(page)
    await page.goto('/programs/trained-teachers')
    const blocked = await page.evaluate(async () => {
      try {
        await fetch('/api/admin/definitely-not-mocked', { method: 'DELETE' })
        return false
      } catch {
        return true
      }
    })
    expect(blocked).toBe(true)
    expect(log.unexpected.some(item => item.includes('definitely-not-mocked'))).toBe(true)
    expect(log.mutations.filter(item => item.path === '/api/admin/programs')).toHaveLength(0)
    assertIsolatedNetwork({ ...log, unexpected: [] })
    expect(log.createProgram).toBeNull()
  })

  for (const method of ['POST', 'PUT', 'PATCH'] as const) {
    test(`등록되지 않은 ${method} Mutation은 차단된다`, async ({ page }) => {
      const log = await installTtIsolatedNetwork(page)
      await page.goto('/programs/trained-teachers')
      const blocked = await page.evaluate(async verb => {
        try {
          await fetch('/api/admin/definitely-not-mocked', { method: verb })
          return false
        } catch {
          return true
        }
      }, method)
      expect(blocked).toBe(true)
      expect(
        log.unexpected.some(item => item.includes(`${method} /api/admin/definitely-not-mocked`))
      ).toBe(true)
      expect(log.mutations.filter(item => item.path === '/api/admin/definitely-not-mocked')).toHaveLength(
        0
      )
      assertIsolatedNetwork({ ...log, unexpected: [] })
    })
  }
})
