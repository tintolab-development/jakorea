import {
  createRegistrationProgramDraftPayload,
  type RegistrationProgramDraftPayloadV1,
} from '@/features/program/general/lib/registration-wizard-draft-payload'
import { getRegistrationStepTemplateSelections } from '@/features/program/shared/lib/step-template-selection'

/**
 * 등록 위저드 임시저장 메타 — **localStorage 전용**.
 * 서버 임시저장 API(admin draft)는 모든 프로그램 유형에서 더 이상 GET/PUT/DELETE하지 않는다.
 * (사용자 결정 2026-10-24: 임시저장은 localStorage만 쓰고, CREATE는 서버 임시저장 ID 없이 한다.)
 */
const REGISTRATION_DRAFT_LOCAL_STORAGE_KEY = 'cms.jakorea.registrationProgramDrafts.v1'

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

export function peekRegistrationProgramDraftPayload(
  programType: string
): RegistrationProgramDraftPayloadV1 | undefined {
  return readRegistrationDraftLocalFile().byProgramType[programType]
}

/**
 * 사용자 임시저장본(localStorage)과 유형별 양식 초안을 함께 제거한다.
 * 해당 유형(programType) 엔트리만 지운다. 키 전체·다른 유형은 건드리지 않는다.
 */
export async function clearRegistrationProgramDraftLocal(programType: string): Promise<void> {
  const file = readRegistrationDraftLocalFile()
  if (file.byProgramType[programType] != null) {
    delete file.byProgramType[programType]
    localStorage.setItem(REGISTRATION_DRAFT_LOCAL_STORAGE_KEY, JSON.stringify(file))
  }
  const { clearRegistrationWizardFormDrafts } = await import(
    '@/features/program/general/lib/registration-wizard-form-draft'
  )
  clearRegistrationWizardFormDrafts(programType)
}

export function registrationTemplateCodeForProgramType(programType: string): string {
  if (programType === 'UJAT') return 'registration-ujat'
  if (programType === 'COMPANY_SCHOOL') return 'registration-economy'
  if (programType === 'TRAINED_TEACHER') return 'registration-trained-teachers'
  return 'registration-general'
}

/** 「임시 저장」 메타 — localStorage 전용. remote API 호출 없음. 모든 유형(일반·TT·1사1교·UJAT) 공통. */
export function syncRegistrationProgramDraftSession(args: {
  programType: string
  registrationTemplateCode: string
  activeStep?: string
  programTitleKo?: string
}): void {
  const payload = createRegistrationProgramDraftPayload({
    registrationTemplateCode: args.registrationTemplateCode,
    activeStep: args.activeStep,
    programTitleKo: args.programTitleKo,
    selectedOperationalTemplates: getRegistrationStepTemplateSelections(args.programType),
  })
  writeRegistrationProgramDraftLocal(args.programType, payload)
}

export async function hydrateRegistrationProgramDraft(
  programType: string
): Promise<RegistrationProgramDraftPayloadV1 | null> {
  return peekRegistrationProgramDraftPayload(programType) ?? null
}
