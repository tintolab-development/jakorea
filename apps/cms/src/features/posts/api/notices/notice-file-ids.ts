export function dedupeFileObjectIds(ids: readonly number[]): number[] {
  const seen = new Set<number>()
  const unique: number[] = []
  for (const id of ids) {
    if (!Number.isInteger(id) || id < 1 || seen.has(id)) continue
    seen.add(id)
    unique.push(id)
  }
  return unique
}
