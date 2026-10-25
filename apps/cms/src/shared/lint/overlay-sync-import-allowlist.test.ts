import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/** P8 ratchet: allowlist는 실제 사용처만 담는다(제거된 사용처는 목록에서도 빼야 한다). */
const repoRoot = path.resolve(__dirname, '../../../../..')
const allowlistPath = path.join(repoRoot, 'tools/eslint/overlay-sync-import-allowlist.json')
const FORBIDDEN_IMPORT =
  /(?:from\s+|import\(\s*)['"][^'"]*(?:-overlay-sync|scoped-overlay-store)['"]/

describe('overlay-sync import allowlist (P8 ratchet)', () => {
  const { files } = JSON.parse(readFileSync(allowlistPath, 'utf8')) as { files: string[] }

  it('목록은 정렬·중복 없음', () => {
    expect([...new Set(files)].sort()).toEqual(files)
  })

  it('목록의 파일은 존재하고 실제로 overlay 동기화 모듈을 import 한다', () => {
    const stale = files.filter(file => {
      const abs = path.join(repoRoot, file)
      if (!existsSync(abs)) return true
      return !FORBIDDEN_IMPORT.test(readFileSync(abs, 'utf8'))
    })
    expect(stale).toEqual([])
  })
})
