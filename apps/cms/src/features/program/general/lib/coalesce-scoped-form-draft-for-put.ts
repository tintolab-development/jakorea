import type { WritingFormDraft, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { normalizeWritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

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
    return mergeBaselineParagraphWithUserCopy(baseParagraph, userParagraph)
  })

  // baseline id → mergedParagraphs 상 현재 index (신규 단락을 끼워 넣을 때마다 갱신)
  const indexById = new Map<string, number>()
  baseline.paragraphs.forEach((p, index) => indexById.set(p.id, index))

  let insertAt: number | null = null
  for (const paragraph of userDraft.paragraphs) {
    if (baseById.has(paragraph.id)) {
      insertAt = (indexById.get(paragraph.id) ?? mergedParagraphs.length - 1) + 1
      continue
    }
    const at: number = insertAt ?? mergedParagraphs.length
    mergedParagraphs.splice(at, 0, paragraph)
    for (const [id, idx] of indexById) {
      if (idx >= at) indexById.set(id, idx + 1)
    }
    insertAt = at + 1
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
