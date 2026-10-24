import type { DetailedProgramDraft } from '@/features/detailed-program/model/detailed-program-management.types'

export type DetailedProgramEditSnapshot = Pick<DetailedProgramDraft, 'name' | 'active'>

function coerceActive(value: boolean): boolean {
  return value === true
}

/** 편집 진입 스냅샷 대비 이름·사용 여부·삭제 스테이징이 바뀌었는지 */
export function hasUnsavedDetailedProgramEdits(input: {
  originals: Record<string, DetailedProgramEditSnapshot>
  drafts: Record<string, DetailedProgramDraft>
  stagedDeleteIds: readonly string[]
}): boolean {
  if (input.stagedDeleteIds.length > 0) return true

  for (const [id, original] of Object.entries(input.originals)) {
    const draft = input.drafts[id]
    if (!draft) continue
    if (draft.name !== original.name) return true
    if (coerceActive(draft.active) !== coerceActive(original.active)) return true
  }
  return false
}
