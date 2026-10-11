#!/usr/bin/env node
/**
 * Fails when production CMS sources import mock paths.
 * Exceptions: unit tests, design-system demos.
 */
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const cmsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcRoot = path.join(cmsRoot, 'src')

const patterns = [
  '@/data/mock',
  'features/program/general/api/temp-mock-capabilities',
  'features/program/general/lib/temp-mock-',
  'participating-instructor-temp-',
  'participating-volunteer-temp-',
  'participating-institution-temp-posts',
  'participating-individual-progress-attendance-local',
  'participating-individual-progress-assignment-local',
  'mock-store',
]

let failed = false
for (const pattern of patterns) {
  try {
    const out = execSync(
      `rg -l "${pattern.replace(/"/g, '\\"')}" "${srcRoot}" --glob '!**/*.test.*' --glob '!**/design-system/**'`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    ).trim()
    if (out) {
      failed = true
      console.error(`\n[check-no-mock-imports] forbidden pattern "${pattern}":\n${out}\n`)
    }
  } catch (e) {
    if (e.status !== 1) throw e
  }
}

if (failed) {
  process.exit(1)
}
console.log('check-no-mock-imports: ok')
