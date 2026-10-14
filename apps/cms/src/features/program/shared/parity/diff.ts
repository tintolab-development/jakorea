import type { FlatRecord } from './flatten'

export type ParityDiffEntry = {
  path: string
  apiTruth: string | number | boolean | null
  uiExposed: string | number | boolean | null
}

export function diffFlatRecords(
  apiTruth: FlatRecord,
  uiExposed: FlatRecord,
  options?: { ignorePaths?: RegExp }
): ParityDiffEntry[] {
  const keys = new Set([...Object.keys(apiTruth), ...Object.keys(uiExposed)])
  const diffs: ParityDiffEntry[] = []
  for (const path of keys) {
    if (options?.ignorePaths?.test(path)) continue
    const a = apiTruth[path] ?? null
    const b = uiExposed[path] ?? null
    if (a === b) continue
    if (a == null && b == null) continue
    diffs.push({ path, apiTruth: a, uiExposed: b })
  }
  return diffs.sort((x, y) => x.path.localeCompare(y.path))
}
