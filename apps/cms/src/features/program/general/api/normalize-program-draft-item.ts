import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import type { ProgramDraftItemResponse } from '@/shared/api/generated/forms-surveys/schemas/programDraftItemResponse'
import type { ProgramDraftResponse } from '@/shared/api/generated/forms-surveys/schemas/programDraftResponse'

function parseDraftPayloadJson(value: unknown): Record<string, unknown> | undefined {
  if (value == null) return undefined
  if (typeof value === 'object') return value as Record<string, unknown>
  if (typeof value !== 'string' || value.trim() === '') return undefined
  try {
    const parsed = JSON.parse(value) as unknown
    return parsed != null && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

function normalizeDraftRecord(record: Record<string, unknown>): ProgramDraftItemResponse | null {
  const draftIdRaw = record.draftId ?? record.id
  const draftId =
    typeof draftIdRaw === 'number'
      ? draftIdRaw
      : typeof draftIdRaw === 'string' && draftIdRaw.trim() !== ''
        ? Number(draftIdRaw)
        : undefined
  if (draftId == null || Number.isNaN(draftId)) return null

  const draftPayload =
    parseDraftPayloadJson(record.draftPayload) ??
    parseDraftPayloadJson(record.draftPayloadJson)

  return {
    draftId,
    programType: typeof record.programType === 'string' ? record.programType : undefined,
    draftPayload,
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : undefined,
  }
}

/** GET/PUT program-draft — BE envelope·필드명 차이를 ProgramDraftItemResponse로 통일 */
export function normalizeProgramDraftItem(payload: unknown): ProgramDraftItemResponse | null {
  const unwrapped = unwrapApiBody<unknown>(payload)
  if (unwrapped == null || typeof unwrapped !== 'object') return null

  const record = unwrapped as Record<string, unknown>
  if ('draft' in record && record.draft === null) return null

  const nestedDraft = (unwrapped as ProgramDraftResponse).draft
  if (nestedDraft != null && typeof nestedDraft === 'object') {
    return normalizeDraftRecord(nestedDraft as Record<string, unknown>)
  }

  return normalizeDraftRecord(record)
}

export function normalizeProgramDraftSaveResponse(payload: unknown): ProgramDraftItemResponse | null {
  const item = normalizeProgramDraftItem(payload)
  if (item?.draftId != null) return item

  const unwrapped = unwrapApiBody<Record<string, unknown>>(payload)
  const draftIdRaw = unwrapped?.draftId ?? unwrapped?.id
  const draftId =
    typeof draftIdRaw === 'number'
      ? draftIdRaw
      : typeof draftIdRaw === 'string' && draftIdRaw.trim() !== ''
        ? Number(draftIdRaw)
        : undefined
  if (draftId == null || Number.isNaN(draftId)) return null

  return {
    draftId,
    programType: typeof unwrapped?.programType === 'string' ? unwrapped.programType : undefined,
  }
}
