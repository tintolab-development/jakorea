import type { ProgramMaterialAssignmentItemRequest } from '@/shared/api/generated/dashboard/schemas/programMaterialAssignmentItemRequest'
import type { ProgramMaterialCandidateResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialCandidateResponse'
import type { ProgramMaterialResponse } from '@/shared/api/generated/dashboard/schemas/programMaterialResponse'
import type { ProgramMaterialAssignmentStatus } from '@/features/program/general/api/program-materials-api-client'

export type ProgramMaterialIdentity = {
  id?: number
  textbookId?: number
  targetLevel?: string
}

export type ProgramMaterialDisplay = {
  title: string
  booksPerKitLabel: string
  studentCountLabel: string
  kitCountLabel: string
  deliveryLabel: string
}

export type ProgramMaterialSaveBlockReason =
  | 'loading'
  | 'candidates_failed'
  | 'selection_mismatch'
  | 'empty_assigned'

export type ProgramMaterialSaveRequestBuild =
  | { ok: true; noneYn: boolean; items: ProgramMaterialAssignmentItemRequest[] }
  | { ok: false; reason: ProgramMaterialSaveBlockReason; message: string }

function positiveCount(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

export function logicalMaterialKey(item: ProgramMaterialIdentity): string {
  if (item.textbookId == null) {
    return item.id != null ? `assignment:${item.id}` : ''
  }
  return `${item.textbookId}:${item.targetLevel?.trim() ?? ''}`
}

export function uniqueCandidatesByLogicalKey(
  candidates: ProgramMaterialCandidateResponse[]
): ProgramMaterialCandidateResponse[] {
  const map = new Map<string, ProgramMaterialCandidateResponse>()
  for (const candidate of candidates) {
    const key = logicalMaterialKey(candidate)
    if (!key) continue
    const previous = map.get(key)
    if (!previous || (candidate.versionNo ?? 0) > (previous.versionNo ?? 0)) {
      map.set(key, candidate)
    }
  }
  return [...map.values()]
}

export function formatProgramMaterialDisplay(item: ProgramMaterialResponse): ProgramMaterialDisplay {
  const name =
    item.textbookNameKo?.trim() ||
    item.textbookNameEn?.trim() ||
    (item.textbookId == null ? '해당 없음' : '교재명 없음')
  const target = item.targetLevel?.trim() ?? ''
  const booksPerKit = positiveCount(item.booksPerKitSnapshot)
  const kitCount = positiveCount(item.calculatedKitCount)
  const totalBooks =
    booksPerKit != null && kitCount != null ? booksPerKit * kitCount : null
  const quantityUnset = item.kitVersionId == null && booksPerKit == null && kitCount == null

  return {
    title: target ? `${name} (${target})` : name,
    booksPerKitLabel: quantityUnset
      ? '수량 정보 미설정'
      : booksPerKit != null
        ? `1키트당 ${booksPerKit}권`
        : '1키트당 권수 미설정',
    studentCountLabel:
      item.studentCountBasis == null || item.studentCountBasis <= 0
        ? '기준 학생 수 미확정'
        : `기준 학생 수 ${item.studentCountBasis}명`,
    kitCountLabel:
      kitCount != null
        ? `필요 수량 ${kitCount}키트${totalBooks != null ? ` (총 ${totalBooks}권)` : ''}`
        : '필요 키트 수 미산출',
    deliveryLabel: item.deliveryStatusTag?.trim() ?? '',
  }
}

export function toExistingAssignmentRequest(
  existing: ProgramMaterialResponse
): ProgramMaterialAssignmentItemRequest {
  return {
    textbookId: existing.textbookId,
    kitId: existing.kitId,
    kitVersionId: existing.kitVersionId,
    targetLevel: existing.targetLevel,
    ...(existing.booksPerKitSnapshot != null
      ? { booksPerKitSnapshot: existing.booksPerKitSnapshot }
      : {}),
    ...(existing.studentCountBasis != null ? { studentCountBasis: existing.studentCountBasis } : {}),
    ...(existing.calculatedKitCount != null
      ? { calculatedKitCount: existing.calculatedKitCount }
      : {}),
    autoMatchedYn: existing.autoMatchedYn ?? false,
  }
}

export function toNewAssignmentRequest(
  candidate: ProgramMaterialCandidateResponse
): ProgramMaterialAssignmentItemRequest {
  return {
    textbookId: candidate.textbookId,
    kitId: candidate.kitId,
    kitVersionId: candidate.kitVersionId,
    targetLevel: candidate.targetLevel,
    autoMatchedYn: candidate.recommendedYn ?? false,
  }
}

export function buildProgramMaterialSaveRequest(input: {
  mode: ProgramMaterialAssignmentStatus
  selectedKeys: string[]
  existingByKey: Map<string, ProgramMaterialResponse>
  candidateByKey: Map<string, ProgramMaterialCandidateResponse>
  previousItems: ProgramMaterialResponse[]
  isLoading: boolean
  candidatesFailed: boolean
}): ProgramMaterialSaveRequestBuild {
  if (input.isLoading) {
    return {
      ok: false,
      reason: 'loading',
      message: '교재 설정을 불러오는 중입니다. 잠시 후 다시 저장해 주세요.',
    }
  }

  if (input.mode === 'NONE') {
    return { ok: true, noneYn: true, items: [] }
  }

  if (input.mode === 'UNDECIDED') {
    return { ok: true, noneYn: false, items: [] }
  }

  if (input.candidatesFailed) {
    const unresolved = input.selectedKeys.filter(key => !input.existingByKey.has(key))
    if (unresolved.length > 0 || (input.selectedKeys.length === 0 && input.previousItems.length > 0)) {
      return {
        ok: false,
        reason: 'candidates_failed',
        message: '교재 후보를 불러오지 못해 저장하지 않았습니다. 기존 배정은 유지됩니다.',
      }
    }
  }

  const items: ProgramMaterialAssignmentItemRequest[] = []
  for (const key of input.selectedKeys) {
    const existing = input.existingByKey.get(key)
    if (existing) {
      items.push(toExistingAssignmentRequest(existing))
      continue
    }
    const candidate = input.candidateByKey.get(key)
    if (!candidate) {
      return {
        ok: false,
        reason: 'selection_mismatch',
        message: '선택한 교재 정보를 확인하지 못했습니다. 기존 배정을 유지한 채 다시 시도해 주세요.',
      }
    }
    items.push(toNewAssignmentRequest(candidate))
  }

  if (items.length === 0 && input.previousItems.length > 0) {
    return {
      ok: false,
      reason: 'empty_assigned',
      message:
        '기존 교재 배정이 비어 저장되지 않았습니다. 교재를 선택하거나 「교재 없음」을 지정해 주세요.',
    }
  }

  return { ok: true, noneYn: false, items }
}
