import {
  deleteMyProgramDraftRemote,
  fetchMyProgramDraftRemote,
  upsertMyProgramDraftRemote,
} from '@/features/program/general/api/program-draft-api-client'
import type { ProgramDraftItemResponse } from '@/shared/api/generated/forms-surveys/schemas/programDraftItemResponse'
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
import { getRegistrationStepTemplateSelections } from '@/features/program/shared/lib/step-template-selection'

const draftIdByProgramType = new Map<string, number>()
const lastPayloadByProgramType = new Map<string, RegistrationProgramDraftPayloadV1>()
const REGISTRATION_DRAFT_LOCAL_STORAGE_KEY =
  'cms.jakorea.registrationProgramDrafts.v1'

type RegistrationDraftLocalFile = {
  version: 1
  byProgramType: Record<string, RegistrationProgramDraftPayloadV1>
}

function readRegistrationDraftLocalFile(): RegistrationDraftLocalFile {
  try {
    const raw = localStorage.getItem(REGISTRATION_DRAFT_LOCAL_STORAGE_KEY)
    if (!raw) return { version: 1, byProgramType: {} }
    const parsed = JSON.parse(raw) as RegistrationDraftLocalFile
    if (parsed?.version !== 1 || typeof parsed.byProgramType !== 'object') {
      return { version: 1, byProgramType: {} }
    }
    return parsed
  } catch {
    return { version: 1, byProgramType: {} }
  }
}

function writeRegistrationProgramDraftLocal(
  programType: string,
  payload: RegistrationProgramDraftPayloadV1
): void {
  const file = readRegistrationDraftLocalFile()
  file.byProgramType[programType] = payload
  localStorage.setItem(REGISTRATION_DRAFT_LOCAL_STORAGE_KEY, JSON.stringify(file))
}

const ensureInflightByProgramType = new Map<string, Promise<number>>()
const fetchInflightByProgramType = new Map<string, Promise<ProgramDraftItemResponse | null>>()

export function peekRegistrationProgramDraftId(programType: string): number | undefined {
  return draftIdByProgramType.get(programType)
}

export function peekRegistrationProgramDraftPayload(
  programType: string
): RegistrationProgramDraftPayloadV1 | undefined {
  return readRegistrationDraftLocalFile().byProgramType[programType]
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

/** 사용자 임시저장본(localStorage)과 유형별 양식 초안을 함께 제거한다. */
export async function clearRegistrationProgramDraftLocal(programType: string): Promise<void> {
  const file = readRegistrationDraftLocalFile()
  delete file.byProgramType[programType]
  localStorage.setItem(REGISTRATION_DRAFT_LOCAL_STORAGE_KEY, JSON.stringify(file))
  const { clearRegistrationWizardFormDrafts } = await import(
    '@/features/program/general/lib/registration-wizard-form-draft'
  )
  clearRegistrationWizardFormDrafts(programType)
}

async function fetchProgramDraftDeduped(
  programType: string
): Promise<ProgramDraftItemResponse | null> {
  const inflight = fetchInflightByProgramType.get(programType)
  if (inflight) return inflight

  const run = fetchMyProgramDraftRemote(programType).finally(() => {
    fetchInflightByProgramType.delete(programType)
  })
  fetchInflightByProgramType.set(programType, run)
  return run
}

function applyRemoteProgramDraft(
  programType: string,
  existing: ProgramDraftItemResponse
): number | null {
  if (existing.draftId == null) return null
  rememberRegistrationProgramDraftId(programType, existing.draftId)
  const payload = parseRegistrationProgramDraftPayload(existing.draftPayload)
  if (payload != null) {
    lastPayloadByProgramType.set(programType, payload)
    hydrateDraftOwnedFormVersions(existing.draftId, payload.formVersions)
  }
  return existing.draftId
}

/** 응답에 programType이 없으면 통과. 있으면 요청 유형과 같아야 재사용한다. */
function draftProgramTypeMatches(
  storedProgramType: string | undefined,
  requestedProgramType: string
): boolean {
  const stored = storedProgramType?.trim()
  if (!stored) return true
  return stored === requestedProgramType
}

/** 등록 완료 직전 form binding 준비용 서버 draft ID. 임시저장에서는 호출하지 않는다. */
export async function ensureRegistrationProgramDraftId(
  programType: string,
  options?: { skipRemoteFetch?: boolean }
): Promise<number> {
  const cached = draftIdByProgramType.get(programType)
  if (cached != null) return cached

  const inflight = ensureInflightByProgramType.get(programType)
  if (inflight) return inflight

  const run = (async () => {
    if (!options?.skipRemoteFetch) {
      const existing = await fetchProgramDraftDeduped(programType)
      // 조회된 draft의 programType이 요청 유형과 다르면 재사용하지 않는다.
      // (다른 유형 draft id를 create에 실으면 BE PROGRAM_DRAFT_TYPE_MISMATCH)
      if (existing?.draftId != null && draftProgramTypeMatches(existing.programType, programType)) {
        const draftId = applyRemoteProgramDraft(programType, existing)
        if (draftId != null) return draftId
      }
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
    if (!draftProgramTypeMatches(saved.programType, programType)) {
      throw new Error(
        `프로그램 임시저장 유형이 요청 유형과 다릅니다. (요청 ${programType}, 저장 ${saved.programType})`
      )
    }
    rememberRegistrationProgramDraftId(programType, draftId)
    return draftId
  })().finally(() => {
    ensureInflightByProgramType.delete(programType)
  })

  ensureInflightByProgramType.set(programType, run)
  return run
}

function registrationTemplateCodeForProgramType(programType: string): string {
  if (programType === 'UJAT') return 'registration-ujat'
  if (programType === 'COMPANY_SCHOOL') return 'registration-economy'
  if (programType === 'TRAINED_TEACHER') return 'registration-trained-teachers'
  return 'registration-general'
}

function buildRegistrationProgramDraftPayloadForSession(args: {
  programType: string
  registrationTemplateCode: string
  activeStep?: string
  programTitleKo?: string
  recruitments?: unknown[]
}): RegistrationProgramDraftPayloadV1 {
  const draftId = draftIdByProgramType.get(args.programType)
  const formVersions =
    draftId != null
      ? Object.fromEntries(
          listDraftOwnedFormVersions(draftId).map(ref => [
            ref.templateCode,
            { templateId: ref.templateId, draftVersionId: ref.draftVersionId },
          ])
        )
      : {}
  const previous = lastPayloadByProgramType.get(args.programType)
  return createRegistrationProgramDraftPayload({
    registrationTemplateCode: args.registrationTemplateCode,
    activeStep: args.activeStep,
    formVersions,
    programTitleKo: args.programTitleKo,
    selectedOperationalTemplates: getRegistrationStepTemplateSelections(args.programType),
    recruitments: args.recruitments ?? previous?.recruitments,
  })
}

/** 1사1교 임시저장 — local 메타와 함께 program-draft PUT. 일반/TT 임시저장 경로는 바꾸지 않는다. */
export async function persistCompanySchoolRegistrationDraftRemote(args?: {
  programTitleKo?: string
  activeStep?: string
}): Promise<void> {
  const programType = 'COMPANY_SCHOOL'
  const payload = buildRegistrationProgramDraftPayloadForSession({
    programType,
    registrationTemplateCode: registrationTemplateCodeForProgramType(programType),
    activeStep: args?.activeStep,
    programTitleKo: args?.programTitleKo,
  })
  lastPayloadByProgramType.set(programType, payload)
  writeRegistrationProgramDraftLocal(programType, payload)
  const saved = await upsertMyProgramDraftRemote(
    { programType, draftPayload: payload },
    { skipGlobalErrorAlert: true }
  )
  if (saved.draftId != null) rememberRegistrationProgramDraftId(programType, saved.draftId)
}

/** 「임시 저장」 메타 — localStorage 전용. remote API 호출 없음. */
export function syncRegistrationProgramDraftSession(args: {
  programType: string
  registrationTemplateCode: string
  activeStep?: string
  programTitleKo?: string
  recruitments?: unknown[]
}): void {
  const payload = buildRegistrationProgramDraftPayloadForSession(args)
  lastPayloadByProgramType.set(args.programType, payload)
  writeRegistrationProgramDraftLocal(args.programType, payload)
}

export async function hydrateRegistrationProgramDraft(
  programType: string,
  _options?: { forceRemote?: boolean }
): Promise<RegistrationProgramDraftPayloadV1 | null> {
  return peekRegistrationProgramDraftPayload(programType) ?? null
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
