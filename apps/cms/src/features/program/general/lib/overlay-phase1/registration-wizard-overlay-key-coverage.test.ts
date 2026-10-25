/**
 * P3 — RHF 키 커버리지: 일반 등록 단락·훅이 쓰는 overlay 키는 모두 위저드 RHF path에 매핑돼야 한다.
 * 인벤토리 문서: apps/cms/docs/overlay-removal/key-inventory.md
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  REGISTRATION_WIZARD_OVERLAY_TO_UI_PATH,
  getNestedValue,
  overlayKeyToWizardUiPath,
  projectRegistrationWizardUiValuesToOverlay,
  setNestedValue,
  wizardUiPathToOverlayKey,
} from './registration-wizard-overlay-path-map'

const SRC = resolve(__dirname, '../../../../..')
const SCAN_DIRS = [
  'features/template/ui/form-set/registration-form/general',
]

/** 단락에서 쓰지만 위저드 RHF 소유가 아닌 키(사유 명시). 비어 있어야 정상. */
const NON_RHF_ALLOWLIST: Record<string, string> = {}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    if (name.startsWith('._')) continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full)
  }
  return out
}

export function collectGeneralRegistrationKeysUsedByParagraphs(): string[] {
  const keys = new Set<string>()
  for (const dir of SCAN_DIRS) {
    for (const file of walk(join(SRC, dir))) {
      const text = readFileSync(file, 'utf8')
      for (const m of text.matchAll(/['`](generalRegistration\.[A-Za-z0-9_]+\.[A-Za-z0-9_]+)['`]/g)) {
        keys.add(m[1])
      }
      // `${overlayPrefix}.basicInfo.x` — 일반 위저드에서 overlayPrefix = 'generalRegistration'
      for (const m of text.matchAll(/`\$\{overlayPrefix\}\.([A-Za-z0-9_]+\.[A-Za-z0-9_]+)`/g)) {
        keys.add(`generalRegistration.${m[1]}`)
      }
    }
  }
  return [...keys].sort()
}

describe('P3 일반 등록 overlay 키 커버리지', () => {
  it('단락이 쓰는 generalRegistration 키 ⊆ RHF 매핑 키 (+사유 있는 allowlist)', () => {
    const used = collectGeneralRegistrationKeysUsedByParagraphs()
    expect(used.length).toBeGreaterThan(20)
    const unmapped = used.filter(
      key => overlayKeyToWizardUiPath(key) == null && NON_RHF_ALLOWLIST[key] == null
    )
    expect(unmapped).toEqual([])
  })

  it('모든 매핑 키는 overlay 키 → RHF path → overlay 키 왕복이 같다', () => {
    for (const [overlayKey, path] of Object.entries(REGISTRATION_WIZARD_OVERLAY_TO_UI_PATH)) {
      expect(wizardUiPathToOverlayKey(path), overlayKey).toBe(overlayKey)
    }
  })

  it('RHF 값 → overlay projection → 같은 값(키마다 고유 센티넬)', () => {
    let values: unknown = {}
    const expected: Record<string, unknown> = {}
    Object.keys(REGISTRATION_WIZARD_OVERLAY_TO_UI_PATH).forEach((overlayKey, index) => {
      const path = REGISTRATION_WIZARD_OVERLAY_TO_UI_PATH[overlayKey]
      const sentinel = `v${index}`
      values = setNestedValue(values, path, sentinel)
      expected[overlayKey] = sentinel
    })
    const projected = projectRegistrationWizardUiValuesToOverlay(values)
    expect(projected).toEqual(expected)
    for (const [overlayKey, path] of Object.entries(REGISTRATION_WIZARD_OVERLAY_TO_UI_PATH)) {
      expect(getNestedValue(values, path)).toBe(expected[overlayKey])
    }
  })
})
