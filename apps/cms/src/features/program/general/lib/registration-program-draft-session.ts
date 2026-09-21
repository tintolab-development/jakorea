import {
  deleteMyProgramDraftRemote,
  fetchMyProgramDraftRemote,
  upsertMyProgramDraftRemote,
} from '@/features/program/general/api/program-draft-api-client'
import {
  createRegistrationProgramDraftPayload,
  parseRegistrationProgramDraftPayload,
  type RegistrationProgramDraftPayloadV1,
} from '@/features/program/general/lib/registration-program-draft-payload'
import {
  clearDraftOwnedFormVersions,
  hydrateDraftOwnedFormVersions,
  listDraftOwnedFormVersions,
} from '@/features/program/general/lib/registration-draft-form-versions'

const draftIdByProgramType = new Map<string, number>()
const lastPayloadByProgramType = new Map<string, RegistrationProgramDraftPayloadV1>()

export function peekRegistrationProgramDraftId(programType: string): number | undefined {
  return draftIdByProgramType.get(programType)
}

export function peekRegistrationProgramDraftPayload(
  programType: string
): RegistrationProgramDraftPayloadV1 | undefined {
  return lastPayloadByProgramType.get(programType)
}

export function rememberRegistrationProgramDraftId(programType: string, draftId: number): void {
  draftIdByProgramType.set(programType, draftId)
}

export function clearRegistrationProgramDraftSession(programType?: string): void {
  if (programType != null) {
    const draftId = draftIdByProgramType.get(programType)
    draftIdByProgramType.delete(programType)
    lastPayloadByProgramType.delete(programType)
    if (draftId != null) clearDraftOwnedFormVersions(draftId)
    return
  }
  for (const draftId of draftIdByProgramType.values()) {
    clearDraftOwnedFormVersions(draftId)
  }
  draftIdByProgramType.clear()
  lastPayloadByProgramType.clear()
}

/** 등록 위저드 — BE program-draft SSOT (copy ownerProgramDraftId) */
export async function ensureRegistrationProgramDraftId(programType: string): Promise<number> {
  const cached = draftIdByProgramType.get(programType)
  if (cached != null) return cached

  const existing = await fetchMyProgramDraftRemote(programType)
  if (existing?.draftId != null) {
    rememberRegistrationProgramDraftId(programType, existing.draftId)
    const payload = parseRegistrationProgramDraftPayload(existing.draftPayload)
    if (payload != null) {
      lastPayloadByProgramType.set(programType, payload)
      hydrateDraftOwnedFormVersions(existing.draftId, payload.formVersions)
    }
    return existing.draftId
  }

  const saved = await upsertMyProgramDraftRemote({
    programType,
    draftPayload: createRegistrationProgramDraftPayload({
      registrationTemplateCode: registrationTemplateCodeForProgramType(programType),
    }),
  })
  const draftId = saved.draftId
  if (draftId == null) {
    throw new Error('프로그램 등록 draft ID를 받지 못했습니다.')
  }
  rememberRegistrationProgramDraftId(programType, draftId)
  return draftId
}

function registrationTemplateCodeForProgramType(programType: string): string {
  if (programType === 'UJAT') return 'registration-ujat'
  if (programType === 'COMPANY_SCHOOL') return 'registration-economy'
  if (programType === 'TRAINED_TEACHER') return 'registration-trained-teachers'
  return 'registration-general'
}

export async function syncRegistrationProgramDraft(args: {
  programType: string
  registrationTemplateCode: string
  activeStep?: string
  programTitleKo?: string
}): Promise<void> {
  const draftId = await ensureRegistrationProgramDraftId(args.programType)
  const formVersions = Object.fromEntries(
    listDraftOwnedFormVersions(draftId).map(ref => [
      ref.templateCode,
      { templateId: ref.templateId, draftVersionId: ref.draftVersionId },
    ])
  )
  const payload = createRegistrationProgramDraftPayload({
    registrationTemplateCode: args.registrationTemplateCode,
    activeStep: args.activeStep,
    formVersions,
    programTitleKo: args.programTitleKo,
  })
  lastPayloadByProgramType.set(args.programType, payload)
  await upsertMyProgramDraftRemote({
    programType: args.programType,
    draftPayload: payload,
  })
}

export async function hydrateRegistrationProgramDraft(
  programType: string
): Promise<RegistrationProgramDraftPayloadV1 | null> {
  const existing = await fetchMyProgramDraftRemote(programType)
  if (existing?.draftId == null) return null
  rememberRegistrationProgramDraftId(programType, existing.draftId)
  const payload = parseRegistrationProgramDraftPayload(existing.draftPayload)
  if (payload == null) return null
  lastPayloadByProgramType.set(programType, payload)
  hydrateDraftOwnedFormVersions(existing.draftId, payload.formVersions)
  return payload
}

export async function deleteRegistrationProgramDraftRemote(programType: string): Promise<void> {
  try {
    await deleteMyProgramDraftRemote(programType)
  } catch (error) {
    console.warn('[registration-program-draft] delete failed', programType, error)
  } finally {
    clearRegistrationProgramDraftSession(programType)
  }
}
