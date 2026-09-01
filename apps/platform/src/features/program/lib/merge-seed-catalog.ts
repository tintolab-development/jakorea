/**
 * 시드 목록 + CMS mock 카탈로그 목록 merge.
 * - 동일 id: catalog 가 seed 를 덮음
 * - catalog 전용 id: 목록 앞쪽에 prepend (등록 직후 확인 용이)
 */

import type { ProgramDetail } from '../model/types'

export function mergeSeedAndCatalogPrograms(
  seed: readonly ProgramDetail[],
  catalog: readonly ProgramDetail[]
): ProgramDetail[] {
  if (catalog.length === 0) return [...seed]

  const seedById = new Map(seed.map(item => [item.id, item]))
  const catalogNew: ProgramDetail[] = []
  const catalogOverrides = new Map<string, ProgramDetail>()

  for (const item of catalog) {
    if (seedById.has(item.id)) {
      catalogOverrides.set(item.id, item)
    } else {
      catalogNew.push(item)
    }
  }

  const mergedSeed = seed.map(item => catalogOverrides.get(item.id) ?? item)
  return [...catalogNew, ...mergedSeed]
}
