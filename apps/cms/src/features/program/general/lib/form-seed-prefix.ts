import { getFormTemplateSeedDraft } from '@/features/template/lib/form-template-seed-registry'
import { resolveWritingFormBaseTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

const SEED_ID_MARKER = '-seed-'

/** `program-instructor-application-seed-personal-info` → `program-instructor-application-seed-` (seed 문단이 아니면 null) */
export function seedPrefixOf(paragraphId: string): string | null {
  const index = paragraphId.indexOf(SEED_ID_MARKER)
  if (index < 0) return null
  return paragraphId.slice(0, index + SEED_ID_MARKER.length)
}

/** draft 문단 중 seed 문단 ID의 접두어 집합 */
export function collectSeedPrefixes(draft: Pick<WritingFormDraft, 'paragraphs'> | null | undefined): Set<string> {
  const prefixes = new Set<string>()
  for (const paragraph of draft?.paragraphs ?? []) {
    const prefix = seedPrefixOf(paragraph.id)
    if (prefix != null) prefixes.add(prefix)
  }
  return prefixes
}

/** templateCode(카탈로그 기준) FE seed의 seed 접두어 집합 — seed가 없으면 빈 집합 */
export function expectedSeedPrefixesForTemplateCode(templateCode: string): Set<string> {
  const catalogCode = resolveWritingFormBaseTemplateCode(templateCode)
  return collectSeedPrefixes(getFormTemplateSeedDraft(catalogCode))
}

/**
 * seed 문단이 있는 draft인데 기대 접두어와 하나도 겹치지 않으면 다른 양식의 본문이다.
 * (seed 문단이 없거나 기대 접두어를 알 수 없으면 판단하지 않는다.)
 */
export function isForeignSeedDraft(
  draft: Pick<WritingFormDraft, 'paragraphs'> | null | undefined,
  expectedPrefixes: ReadonlySet<string>
): boolean {
  if (expectedPrefixes.size === 0) return false
  const prefixes = collectSeedPrefixes(draft)
  if (prefixes.size === 0) return false
  for (const prefix of prefixes) {
    if (expectedPrefixes.has(prefix)) return false
  }
  return true
}
