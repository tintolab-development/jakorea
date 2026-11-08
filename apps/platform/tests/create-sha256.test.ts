import { describe, expect, it } from 'vitest'
import { createSha256 } from '../src/shared/lib/create-sha256'

describe('createSha256', () => {
  it('returns SHA-256 hex of file bytes', async () => {
    const file = new File(['hello'], 'hello.txt', { type: 'text/plain' })
    await expect(createSha256(file)).resolves.toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    )
  })
})
