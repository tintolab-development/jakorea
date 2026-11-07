import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const dir = dirname(fileURLToPath(import.meta.url))

describe('dashboard widget list query freshness', () => {
  it.each(['use-recruitment-status-list.ts', 'use-program-inquiry-status-list.ts'])(
    '%s keeps staleTime 60s and does not force refetchOnMount always',
    fileName => {
      const src = readFileSync(join(dir, fileName), 'utf8')
      expect(src).toContain('staleTime: 60_000')
      expect(src).not.toMatch(/refetchOnMount:\s*'always'/)
      expect(src).not.toMatch(/refetchOnMount:\s*false/)
    }
  )
})
