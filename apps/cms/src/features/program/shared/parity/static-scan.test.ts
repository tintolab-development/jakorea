import { describe, expect, it } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

describe('program detail parity — static scan', () => {
  it('scan-static-violations.mjs passes (no error-severity hits)', () => {
    const script = join(process.cwd(), 'scripts/parity/scan-static-violations.mjs')
    execSync(`node "${script}"`, { encoding: 'utf8', cwd: process.cwd() })
    const out = join(process.cwd(), 'docs/audit/program-detail-parity-static-violations.json')
    expect(existsSync(out)).toBe(true)
    const payload = JSON.parse(readFileSync(out, 'utf8')) as { errorCount: number }
    expect(payload.errorCount).toBe(0)
  })
})
