import {
  DETAILED_PROGRAM_BULK_MAX,
  toDetailedProgramBulkDeleteItem,
  toDetailedProgramBulkUpdateItem,
} from './bulk-update'
import type {
  DetailedProgramBulkDeleteItem,
  DetailedProgramBulkUpdateItem,
} from './bulk-update'
import type { DetailedProgramDraft } from '@/features/detailed-program/model/detailed-program-management.types'

export const DETAILED_PROGRAM_NAME_REQUIRED_MESSAGE = '세부 프로그램명을 입력해 주세요.'
export const DETAILED_PROGRAM_NAME_DUPLICATE_MESSAGE = '이미 존재하는 세부 프로그램명입니다.'
export const DETAILED_PROGRAM_VERSION_MISSING_MESSAGE =
  '버전 정보가 없어 저장할 수 없습니다. 최신 목록을 확인한 후 다시 시도해 주세요.'

export function detailedProgramBulkMaxMessage(kind: 'update' | 'delete' | 'changes'): string {
  if (kind === 'delete') {
    return `한 번에 최대 ${DETAILED_PROGRAM_BULK_MAX}건까지 삭제할 수 있습니다.`
  }
  if (kind === 'changes') {
    return `한 번에 최대 ${DETAILED_PROGRAM_BULK_MAX}건까지 저장할 수 있습니다.`
  }
  return `한 번에 최대 ${DETAILED_PROGRAM_BULK_MAX}건까지 수정할 수 있습니다.`
}

export function normalizeDetailedProgramName(name: string): string {
  return name.trim().toLowerCase()
}

export type DetailedProgramSavePlan = {
  deleteIds: string[]
  deleteItems: DetailedProgramBulkDeleteItem[]
  updateItems: DetailedProgramBulkUpdateItem[]
}

export type DetailedProgramSaveBlock =
  | {
      reason: 'required-name' | 'duplicate-name' | 'version-missing'
      nameErrorById: Record<string, string>
      message: string
    }
  | {
      reason: 'over-max'
      kind: 'update' | 'delete' | 'changes'
      message: string
    }

export type DetailedProgramSavePlanResult =
  | { ok: true; plan: DetailedProgramSavePlan }
  | { ok: false; block: DetailedProgramSaveBlock }

function isNameUnchanged(originalName: string, nextName: string): boolean {
  return normalizeDetailedProgramName(originalName) === normalizeDetailedProgramName(nextName)
}

/** 현재 편집 행 기준 저장 계획. 서버 전역 중복은 백엔드가 최종 판정한다. */
export function planDetailedProgramSave(input: {
  originals: Record<string, DetailedProgramDraft>
  drafts: Record<string, DetailedProgramDraft>
  stagedDeleteIds: readonly string[]
}): DetailedProgramSavePlanResult {
  const staged = new Set(input.stagedDeleteIds)
  const deleteIds = [...new Set(input.stagedDeleteIds.filter(Boolean))]
  const deleteItems: DetailedProgramBulkDeleteItem[] = []
  const missingDeleteVersionIds: string[] = []
  for (const id of deleteIds) {
    const version = input.originals[id]?.version ?? input.drafts[id]?.version
    if (typeof version !== 'number') {
      missingDeleteVersionIds.push(id)
      continue
    }
    deleteItems.push(toDetailedProgramBulkDeleteItem({ id, version }))
  }

  const nameErrorById: Record<string, string> = {}
  const normalizedToIds = new Map<string, string[]>()
  const changed: Array<{
    id: string
    name: string
    active: boolean
    version: number | undefined
    original: DetailedProgramDraft
  }> = []

  for (const [id, original] of Object.entries(input.originals)) {
    if (staged.has(id)) continue
    const draft = input.drafts[id]
    if (!draft) continue

    const nextName = draft.name.trim()
    if (!nextName) {
      nameErrorById[id] = DETAILED_PROGRAM_NAME_REQUIRED_MESSAGE
      continue
    }

    const key = normalizeDetailedProgramName(nextName)
    const ids = normalizedToIds.get(key) ?? []
    ids.push(id)
    normalizedToIds.set(key, ids)

    const nextActive = draft.active === true
    if (original.name === nextName && original.active === nextActive) continue
    changed.push({
      id,
      name: nextName,
      active: nextActive,
      version: draft.version ?? original.version,
      original,
    })
  }

  if (Object.keys(nameErrorById).length > 0) {
    return {
      ok: false,
      block: {
        reason: 'required-name',
        nameErrorById,
        message: DETAILED_PROGRAM_NAME_REQUIRED_MESSAGE,
      },
    }
  }

  const duplicateIds = [...normalizedToIds.values()].flatMap(ids => (ids.length > 1 ? ids : []))
  if (duplicateIds.length > 0) {
    const duplicateErrorById: Record<string, string> = {}
    for (const id of duplicateIds) {
      duplicateErrorById[id] = DETAILED_PROGRAM_NAME_DUPLICATE_MESSAGE
    }
    return {
      ok: false,
      block: {
        reason: 'duplicate-name',
        nameErrorById: duplicateErrorById,
        message: DETAILED_PROGRAM_NAME_DUPLICATE_MESSAGE,
      },
    }
  }

  const missingVersionIds = changed
    .filter(row => typeof row.version !== 'number')
    .map(row => row.id)
  if (missingVersionIds.length > 0) {
    const versionErrorById: Record<string, string> = {}
    for (const id of missingVersionIds) {
      versionErrorById[id] = DETAILED_PROGRAM_VERSION_MISSING_MESSAGE
    }
    return {
      ok: false,
      block: {
        reason: 'version-missing',
        nameErrorById: versionErrorById,
        message: DETAILED_PROGRAM_VERSION_MISSING_MESSAGE,
      },
    }
  }

  const isMixed = changed.length > 0 && deleteIds.length > 0
  if (isMixed && missingDeleteVersionIds.length > 0) {
    const versionErrorById: Record<string, string> = {}
    for (const id of missingDeleteVersionIds) {
      versionErrorById[id] = DETAILED_PROGRAM_VERSION_MISSING_MESSAGE
    }
    return {
      ok: false,
      block: {
        reason: 'version-missing',
        nameErrorById: versionErrorById,
        message: DETAILED_PROGRAM_VERSION_MISSING_MESSAGE,
      },
    }
  }

  if (deleteIds.length > DETAILED_PROGRAM_BULK_MAX) {
    return {
      ok: false,
      block: {
        reason: 'over-max',
        kind: 'delete',
        message: detailedProgramBulkMaxMessage('delete'),
      },
    }
  }

  if (changed.length > DETAILED_PROGRAM_BULK_MAX) {
    return {
      ok: false,
      block: {
        reason: 'over-max',
        kind: 'update',
        message: detailedProgramBulkMaxMessage('update'),
      },
    }
  }

  if (changed.length + deleteIds.length > DETAILED_PROGRAM_BULK_MAX) {
    return {
      ok: false,
      block: {
        reason: 'over-max',
        kind: 'changes',
        message: detailedProgramBulkMaxMessage('changes'),
      },
    }
  }

  return {
    ok: true,
    plan: {
      deleteIds,
      deleteItems,
      updateItems: changed.map(row =>
        toDetailedProgramBulkUpdateItem({
          id: row.id,
          name: row.name,
          active: row.active,
          version: row.version as number,
        })
      ),
    },
  }
}

export function isOwnNameRetention(originalName: string, nextName: string): boolean {
  return isNameUnchanged(originalName, nextName)
}
