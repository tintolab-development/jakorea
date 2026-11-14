import type { WritingFormDraft, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { normalizeWritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { seedPrefixOf } from '@/features/program/general/lib/form-seed-prefix'

function paragraphMap(paragraphs: readonly WritingFormParagraph[]): Map<string, WritingFormParagraph> {
  return new Map(paragraphs.map(p => [p.id, p]))
}

/** baseline GET shape 유지 — 편집기가 시드 short_essay 등에 `items` 등을 붙여도 PUT에서 제거 */
function mergeBaselineParagraphWithUserCopy(
  baseParagraph: WritingFormParagraph,
  userParagraph: WritingFormParagraph
): WritingFormParagraph {
  const merged = {
    ...baseParagraph,
    ...userParagraph,
    id: baseParagraph.id,
    kind: baseParagraph.kind,
    variant: baseParagraph.variant,
  } as WritingFormParagraph

  const out = { ...merged } as unknown as Record<string, unknown>
  const baseRecord = baseParagraph as unknown as Record<string, unknown>
  for (const key of Object.keys(out)) {
    if (!(key in baseRecord)) {
      delete out[key]
    }
  }
  return out as unknown as WritingFormParagraph
}

/** 개인정보 수집·이용 / 제3자 제공 표 — 마지막(보유기간) 셀은 BE가 canonical seed와 글자 단위로 비교하는 시스템 값 */
const PRIVACY_RETENTION_PARAGRAPH_ID_PATTERN = /-seed-(personal-info|third-party)$/

type FieldCell = Record<string, unknown>

/**
 * 보유기간 셀(각 행 마지막 셀) value를 baseline 값으로 되돌린다.
 * 사용자 값·오래된 임시저장본이 시스템 셀을 덮어써 409(PROTECTED_STRUCTURE_CHANGED)가 나지 않게 한다.
 * 나머지 셀은 사용자 값을 유지한다.
 */
function restorePrivacyRetentionCells(
  baseParagraph: WritingFormParagraph,
  mergedParagraph: WritingFormParagraph
): WritingFormParagraph {
  if (!PRIVACY_RETENTION_PARAGRAPH_ID_PATTERN.test(baseParagraph.id)) return mergedParagraph
  const baseRows = (baseParagraph as unknown as { fieldDataRows?: unknown }).fieldDataRows
  const mergedRows = (mergedParagraph as unknown as { fieldDataRows?: unknown }).fieldDataRows
  if (!Array.isArray(baseRows) || !Array.isArray(mergedRows)) return mergedParagraph

  const restoredRows = mergedRows.map((row: unknown, rowIndex: number) => {
    const baseRow: unknown = baseRows[rowIndex]
    if (!Array.isArray(row) || !Array.isArray(baseRow) || row.length === 0 || baseRow.length === 0) {
      return row
    }
    const baseLast = baseRow[baseRow.length - 1] as FieldCell | undefined
    const lastIndex = row.length - 1
    const userLast = row[lastIndex] as FieldCell | undefined
    if (baseLast == null || typeof baseLast !== 'object' || !('value' in baseLast)) return row
    if (userLast != null && typeof userLast === 'object' && userLast.value === baseLast.value) return row
    const next = [...row]
    next[lastIndex] = {
      ...(userLast != null && typeof userLast === 'object' ? userLast : baseLast),
      value: baseLast.value,
    }
    return next
  })

  return { ...mergedParagraph, fieldDataRows: restoredRows } as unknown as WritingFormParagraph
}

/**
 * program-scoped copy PUT — baseline(서버 copy GET) 위에 user draft를 merge.
 * protected seed paragraph id·variant·kind·순서는 baseline 유지, 카피성 필드만 user 반영.
 * baseline에 없는(=신규 추가) 단락은 userDraft에서 **바로 앞에 있던 baseline 단락**
 * 뒤에 끼워 넣는다 — 편집기에서 중간에 삽입한 단락이 항상 맨 끝으로 밀리지 않게 한다.
 * (앞에 매칭되는 baseline 단락이 아예 없으면 기존처럼 맨 끝에 붙인다 — id 탬퍼링 등
 * baseline과 매칭이 끊긴 항목이 보호된 baseline 슬롯을 밀어내지 않도록 하는 안전장치.)
 */
export function coalesceScopedFormDraftForPut(
  baseline: WritingFormDraft,
  userDraft: WritingFormDraft
): WritingFormDraft {
  const baseById = paragraphMap(baseline.paragraphs)
  const userById = paragraphMap(userDraft.paragraphs)

  const mergedParagraphs: WritingFormParagraph[] = baseline.paragraphs.map(baseParagraph => {
    const userParagraph = userById.get(baseParagraph.id)
    if (userParagraph == null) return baseParagraph
    if (baseParagraph.kind !== userParagraph.kind || baseParagraph.variant !== userParagraph.variant) {
      return baseParagraph
    }
    return restorePrivacyRetentionCells(
      baseParagraph,
      mergeBaselineParagraphWithUserCopy(baseParagraph, userParagraph)
    )
  })

  // baseline seed 접두어 — 다른 양식의 seed 문단(FOREIGN_PROTECTED_ID 409 대상) 혼입 차단용
  const baselineSeedPrefixes = new Set(
    baseline.paragraphs.map(p => seedPrefixOf(p.id)).filter((prefix): prefix is string => prefix != null)
  )
  const droppedForeignSeedIds: string[] = []

  // baseline id → mergedParagraphs 상 현재 index (신규 단락을 끼워 넣을 때마다 갱신)
  const indexById = new Map<string, number>()
  baseline.paragraphs.forEach((p, index) => indexById.set(p.id, index))

  let insertAt: number | null = null
  for (const paragraph of userDraft.paragraphs) {
    if (baseById.has(paragraph.id)) {
      insertAt = (indexById.get(paragraph.id) ?? mergedParagraphs.length - 1) + 1
      continue
    }
    const userSeedPrefix = seedPrefixOf(paragraph.id)
    if (userSeedPrefix != null && !baselineSeedPrefixes.has(userSeedPrefix)) {
      droppedForeignSeedIds.push(paragraph.id)
      continue
    }
    const at: number = insertAt ?? mergedParagraphs.length
    mergedParagraphs.splice(at, 0, paragraph)
    for (const [id, idx] of indexById) {
      if (idx >= at) indexById.set(id, idx + 1)
    }
    insertAt = at + 1
  }

  if (droppedForeignSeedIds.length > 0) {
    console.warn('[coalesceScopedFormDraftForPut] 다른 양식의 seed 문단을 PUT payload에서 제외했습니다.', {
      baselineSeedPrefixes: [...baselineSeedPrefixes],
      droppedForeignSeedIds,
    })
  }

  return normalizeWritingFormDraft({
    ...baseline,
    formSettings: {
      ...baseline.formSettings,
      ...userDraft.formSettings,
    },
    paragraphs: mergedParagraphs,
  })
}
