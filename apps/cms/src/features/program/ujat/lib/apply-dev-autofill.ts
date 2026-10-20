import {
  UJAT_DEV_AUTOFILL_CASE_LABELS,
  type UjatDevAutofillCaseId,
} from '@/features/program/ujat/lib/dev-autofill-cases'
import {
  buildUjatDevAutofillFixture,
  type ResolvedUjatDevDependencies,
  type UjatDevAutofillFixture,
} from '@/features/program/ujat/lib/dev-autofill-fixture'
import {
  validateUjatDevAutofillFixture,
  type UjatDevAutofillValidationIssue,
} from '@/features/program/ujat/lib/dev-autofill-validate'
import { listIncompleteUjatProgramRegistrationWizardRequiredFields } from '@/features/program/ujat/lib/ujat-program-registration-required-fields'
import { listUjatEducationRegionsActive } from '@/features/program/ujat/lib/ujat-education-regions'
import { resolveUjatDefaultPaymentItemValues } from '@/features/program/ujat/lib/ujat-wage-info-display'
import { getPublicHolidayDateKeysForSchedule } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview-assign/schedule-utils'
import { UJAT_PROGRAM_REGISTRATION_STEPS } from '@/features/program/ujat/model/ujat-program-registration-flow'
import { listDevAutofillRecruitOverlayTargets } from '@/features/program/shared/lib/dev-autofill-recruit-overlay'
import { getSelectedOperationalTemplateCode } from '@/features/program/shared/lib/step-template-selection'
import { fillBlankApplicationFormThirdPartyRecipients } from '@/features/program/general/lib/fill-application-form-third-party-recipient'
import { createSeedDraftForOperationalCatalogId } from '@/features/program/general/lib/registration-operational-form-drafts'
import {
  peekRegistrationWizardSessionDrafts,
  publishRegistrationWizardApplicationDraft,
} from '@/features/program/general/lib/registration-wizard-session-drafts'
import {
  getSponsorContacts,
  getSponsorOptionsList,
  shouldUseSponsorsRemoteApi,
} from '@/features/sponsor/api/admin-sponsors-service'
import { fetchAllMembersPagesRemote } from '@/features/user/api/fetch-all-members-pages-remote'
import { instructorListRolesExactAnyOf } from '@/features/user/api/map-roles-exact-any-of'
import {
  ensurePaymentItemCatalog,
  getActivePaymentItemCatalogOptions,
} from '@/features/template/lib/template-registration-payment-item-options'
import { UJAT_SPONSOR_ALL_VALUE } from '@/features/program/ujat/lib/ujat-registration-basic-info-defaults'
import {
  getUjatProgramRegistrationOverlayRecord,
  replaceUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  peekUjatRecruitInstitutionOverlayRecord,
  replaceUjatRecruitInstitutionOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  peekUjatRecruitVolunteerOverlayRecord,
  replaceUjatRecruitVolunteerOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'
import {
  peekGeneralRecruitOverlayRecord,
  replaceGeneralRecruitOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  peekUjatApplicationInstitutionOverlayRecord,
  replaceUjatApplicationInstitutionOverlayForScope,
} from '@/features/template/ui/form-set/application-form/UJAT-institution/ujat-application-institution-overlay-sync'
import {
  peekUjatApplicationVolunteerOverlayRecord,
  replaceUjatApplicationVolunteerOverlayForScope,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-sync'
import {
  peekGeneralApplicationOverlayRecord,
  replaceGeneralApplicationOverlayForScope,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'

/** 이전 프리셋 잔류를 막기 위해 교체 전 지우는 UJAT 소유 키 prefix */
const REGISTRATION_OWNED_PREFIXES = ['ujat.'] as const
const RECRUIT_INSTITUTION_OWNED_PREFIXES = ['ujat.recruit.institution.'] as const
const RECRUIT_VOLUNTEER_OWNED_PREFIXES = ['ujat.recruit.volunteer.'] as const
const RECRUIT_GENERAL_OWNED_PREFIXES = [
  'ujatRecruit.',
  'recruitVolunteer.h1.',
  'recruitVolunteer.h2.',
  'recruit.volunteer.h1.',
  'recruit.volunteer.h2.',
] as const
const APPLICATION_INSTITUTION_OWNED_PREFIXES = ['ujatApplication.'] as const
const APPLICATION_GENERAL_OWNED_PREFIXES = ['application.ujat.inst.'] as const
const APPLICATION_VOLUNTEER_OWNED_PREFIXES = ['ujatVolunteerApplication.'] as const

export type UjatDevAutofillErrorCode =
  | 'NOT_DEV'
  | 'ALREADY_RUNNING'
  | 'REGIONS_EMPTY'
  | 'FIXTURE_INVALID'
  | 'APPLY_FAILED'

export class UjatDevAutofillError extends Error {
  readonly code: UjatDevAutofillErrorCode
  readonly issues: UjatDevAutofillValidationIssue[]

  constructor(
    code: UjatDevAutofillErrorCode,
    message: string,
    issues: UjatDevAutofillValidationIssue[] = []
  ) {
    super(message)
    this.name = 'UjatDevAutofillError'
    this.code = code
    this.issues = issues
  }
}

export type UjatDevAutofillTargets = {
  recruitInstitution: string[]
  recruitVolunteer: string[]
  applicationInstitution: string
  applicationVolunteer: string
}

export type UjatDevAutofillResult = {
  caseId: UjatDevAutofillCaseId
  caseLabel: string
  businessYear: number
  programManagementName: string
  sponsorId: string
  sponsorContactId: string
  targets: UjatDevAutofillTargets
  /** 자동으로 채우지 못해 직접 입력해야 하는 항목 */
  manualInputRequired: string[]
  /** 적용 후 제품 필수값 검증 결과 (빈 배열이어야 등록 가능) */
  incompleteRequiredFields: string[]
}

function omitPrefixes(
  record: Record<string, unknown>,
  prefixes: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(record)) {
    if (prefixes.some(prefix => key.startsWith(prefix))) continue
    out[key] = value
  }
  return out
}

function byId(a: { id?: unknown }, b: { id?: unknown }): number {
  const left = String(a.id ?? '')
  const right = String(b.id ?? '')
  const leftNum = Number(left)
  const rightNum = Number(right)
  if (Number.isFinite(leftNum) && Number.isFinite(rightNum)) return leftNum - rightNum
  return left.localeCompare(right)
}

/** id 오름차순으로 담당자가 있는 첫 후원사. remote가 꺼져 있으면 UJAT 기본값 「전체」 */
async function resolveSponsor(): Promise<ResolvedUjatDevDependencies['sponsor']> {
  const all = { sponsorId: UJAT_SPONSOR_ALL_VALUE, contactId: UJAT_SPONSOR_ALL_VALUE }
  if (!shouldUseSponsorsRemoteApi()) return all
  const sponsors = [...(await getSponsorOptionsList())].filter(row => row?.id).sort(byId)
  for (const sponsor of sponsors) {
    const sponsorId = String(sponsor.id).trim()
    const contacts = [...(await getSponsorContacts(sponsorId))].filter(row => row?.id).sort(byId)
    const contact = contacts[0]
    if (contact) return { sponsorId, contactId: String(contact.id).trim() }
  }
  return all
}

async function resolveInstructorId(): Promise<string | null> {
  try {
    const users = await fetchAllMembersPagesRemote({
      rolesExactAnyOf: instructorListRolesExactAnyOf(),
    })
    const first = [...users].filter(user => user?.id != null && user.name?.trim()).sort(byId)[0]
    return first ? String(first.id) : null
  } catch {
    return null
  }
}

async function resolvePaymentItemValues(): Promise<string[]> {
  await ensurePaymentItemCatalog()
  const valid = new Set(getActivePaymentItemCatalogOptions().map(option => String(option.value)))
  return resolveUjatDefaultPaymentItemValues().filter(id => valid.has(id))
}

function needsInstructor(caseId: UjatDevAutofillCaseId): boolean {
  return caseId === 'REG-05' || caseId === 'REG-06'
}

/** GET만 사용한다. 실패하면 store를 건드리기 전에 예외로 끝난다. */
export async function resolveUjatDevAutofillDependencies(
  caseId: UjatDevAutofillCaseId
): Promise<ResolvedUjatDevDependencies> {
  const regions = listUjatEducationRegionsActive()
  if (regions.length === 0) {
    throw new UjatDevAutofillError(
      'REGIONS_EMPTY',
      '사용 중인 UJAT 교육 지역이 없습니다. 교육 지역 관리에서 지역을 먼저 활성화해 주세요.'
    )
  }
  const [sponsor, instructorId, paymentItemValues] = await Promise.all([
    resolveSponsor(),
    needsInstructor(caseId) ? resolveInstructorId() : Promise.resolve(null),
    resolvePaymentItemValues(),
  ])
  return {
    regions,
    sponsor,
    instructorId,
    paymentItemValues,
    holidayDateKeys: getPublicHolidayDateKeysForSchedule(),
  }
}

function defaultStepTemplateId(stepKey: string): string {
  return UJAT_PROGRAM_REGISTRATION_STEPS.find(step => step.key === stepKey)?.templateId ?? stepKey
}

/** 모집·신청 모두 지금 선택된 운영 양식 버킷 */
export function resolveUjatDevAutofillTargets(): UjatDevAutofillTargets {
  const recruit = listDevAutofillRecruitOverlayTargets('ujat')
  const applicationInstitutionDefault = defaultStepTemplateId('application-ujat-school')
  const applicationVolunteerDefault = defaultStepTemplateId('application-ujat-volunteer')
  return {
    recruitInstitution: recruit.ujatInstitution,
    recruitVolunteer: recruit.ujatVolunteer,
    applicationInstitution: getSelectedOperationalTemplateCode(
      'UJAT',
      'application-ujat-school',
      applicationInstitutionDefault
    ),
    applicationVolunteer: getSelectedOperationalTemplateCode(
      'UJAT',
      'application-ujat-volunteer',
      applicationVolunteerDefault
    ),
  }
}

type StoreSnapshot = () => void

function snapshotStores(targets: UjatDevAutofillTargets): StoreSnapshot {
  const registration = { ...getUjatProgramRegistrationOverlayRecord() }
  const recruitCodes = [...targets.recruitInstitution, ...targets.recruitVolunteer]
  const recruitInstitution = targets.recruitInstitution.map(code => [code, peekUjatRecruitInstitutionOverlayRecord(code)] as const)
  const recruitVolunteer = targets.recruitVolunteer.map(code => [code, peekUjatRecruitVolunteerOverlayRecord(code)] as const)
  const recruitGeneral = recruitCodes.map(code => [code, peekGeneralRecruitOverlayRecord(code)] as const)
  const appInstitution = peekUjatApplicationInstitutionOverlayRecord(targets.applicationInstitution)
  const appGeneral = peekGeneralApplicationOverlayRecord(targets.applicationInstitution)
  const appVolunteer = peekUjatApplicationVolunteerOverlayRecord(targets.applicationVolunteer)
  return () => {
    replaceUjatProgramRegistrationOverlay(registration)
    for (const [code, record] of recruitInstitution) replaceUjatRecruitInstitutionOverlayForScope(code, record)
    for (const [code, record] of recruitVolunteer) replaceUjatRecruitVolunteerOverlayForScope(code, record)
    for (const [code, record] of recruitGeneral) replaceGeneralRecruitOverlayForScope(code, record)
    replaceUjatApplicationInstitutionOverlayForScope(targets.applicationInstitution, appInstitution)
    replaceGeneralApplicationOverlayForScope(targets.applicationInstitution, appGeneral)
    replaceUjatApplicationVolunteerOverlayForScope(targets.applicationVolunteer, appVolunteer)
  }
}

function applyOverlays(fixture: UjatDevAutofillFixture, targets: UjatDevAutofillTargets): void {
  replaceUjatProgramRegistrationOverlay({
    ...omitPrefixes(getUjatProgramRegistrationOverlayRecord(), REGISTRATION_OWNED_PREFIXES),
    ...fixture.registration,
  })
  for (const code of new Set(targets.recruitInstitution)) {
    replaceUjatRecruitInstitutionOverlayForScope(code, {
      ...omitPrefixes(peekUjatRecruitInstitutionOverlayRecord(code), RECRUIT_INSTITUTION_OWNED_PREFIXES),
      ...fixture.recruitInstitution,
    })
  }
  for (const code of new Set(targets.recruitVolunteer)) {
    replaceUjatRecruitVolunteerOverlayForScope(code, {
      ...omitPrefixes(peekUjatRecruitVolunteerOverlayRecord(code), RECRUIT_VOLUNTEER_OWNED_PREFIXES),
      ...fixture.recruitVolunteer,
    })
  }
  for (const code of new Set([...targets.recruitInstitution, ...targets.recruitVolunteer])) {
    replaceGeneralRecruitOverlayForScope(code, {
      ...omitPrefixes(peekGeneralRecruitOverlayRecord(code), RECRUIT_GENERAL_OWNED_PREFIXES),
      ...fixture.recruitGeneral,
    })
  }
  const institutionCode = targets.applicationInstitution
  replaceUjatApplicationInstitutionOverlayForScope(institutionCode, {
    ...omitPrefixes(
      peekUjatApplicationInstitutionOverlayRecord(institutionCode),
      APPLICATION_INSTITUTION_OWNED_PREFIXES
    ),
    ...fixture.applicationInstitution.overlay,
  })
  replaceGeneralApplicationOverlayForScope(institutionCode, {
    ...omitPrefixes(peekGeneralApplicationOverlayRecord(institutionCode), APPLICATION_GENERAL_OWNED_PREFIXES),
    ...fixture.applicationInstitution.generalOverlay,
  })
  const volunteerCode = targets.applicationVolunteer
  replaceUjatApplicationVolunteerOverlayForScope(volunteerCode, {
    ...omitPrefixes(peekUjatApplicationVolunteerOverlayRecord(volunteerCode), APPLICATION_VOLUNTEER_OWNED_PREFIXES),
    ...fixture.applicationVolunteer.overlay,
  })
}

/**
 * 신청 양식 draft. 이미 세션 draft가 있으면 그 양식 그대로 쓰고,
 * 기본 양식일 때만 seed를 만든다 (사용자가 고른 다른 양식을 seed로 덮지 않는다).
 */
function resolveApplicationDraft(templateCode: string, defaultCode: string) {
  const session = peekRegistrationWizardSessionDrafts().find(entry => entry.templateCode === templateCode)
  if (session) return session.draft
  if (templateCode !== defaultCode) return null
  return createSeedDraftForOperationalCatalogId(templateCode)
}

function publishApplicationDrafts(
  fixture: UjatDevAutofillFixture,
  targets: UjatDevAutofillTargets,
  manualInputRequired: string[]
): void {
  const entries = [
    {
      code: targets.applicationInstitution,
      defaultCode: defaultStepTemplateId('application-ujat-school'),
      editorState: fixture.applicationInstitution.editorState,
      overlay: {
        ...fixture.applicationInstitution.overlay,
        ...fixture.applicationInstitution.generalOverlay,
      },
      manualKey: 'application.institution.draft',
    },
    {
      code: targets.applicationVolunteer,
      defaultCode: defaultStepTemplateId('application-ujat-volunteer'),
      editorState: fixture.applicationVolunteer.editorState,
      overlay: fixture.applicationVolunteer.overlay,
      manualKey: 'application.volunteer.draft',
    },
  ]
  for (const entry of entries) {
    const draft = resolveApplicationDraft(entry.code, entry.defaultCode)
    if (draft == null) {
      manualInputRequired.push(entry.manualKey)
      continue
    }
    publishRegistrationWizardApplicationDraft({
      templateCode: entry.code,
      draft: fillBlankApplicationFormThirdPartyRecipients(draft, 'JA코리아'),
      editorState: entry.editorState,
      overlay: entry.overlay,
    })
  }
}

let running = false

export function isUjatDevAutofillRunning(): boolean {
  return running
}

/**
 * UJAT 등록 위저드 6단계에 선택 케이스 값을 채운다. 서버 등록·저장은 하지 않는다.
 * 참조 데이터 조회·Fixture 검증이 모두 끝난 뒤에만 store를 교체하고, 교체 중 오류가 나면 이전 상태로 되돌린다.
 */
export async function applyUjatDevAutofillCase(options: {
  caseId: UjatDevAutofillCaseId
  businessYear: number
  dependencies?: ResolvedUjatDevDependencies
}): Promise<UjatDevAutofillResult> {
  if (!import.meta.env.DEV) {
    throw new UjatDevAutofillError('NOT_DEV', '자동입력(개발용)은 개발 환경에서만 사용할 수 있습니다.')
  }
  if (running) {
    throw new UjatDevAutofillError('ALREADY_RUNNING', '자동입력이 이미 실행 중입니다.')
  }
  running = true
  try {
    const dependencies =
      options.dependencies ?? (await resolveUjatDevAutofillDependencies(options.caseId))
    const fixture = buildUjatDevAutofillFixture(
      { caseId: options.caseId, businessYear: options.businessYear },
      dependencies
    )
    const issues = validateUjatDevAutofillFixture(fixture, dependencies.holidayDateKeys)
    if (issues.length > 0) {
      throw new UjatDevAutofillError(
        'FIXTURE_INVALID',
        issues.map(issue => issue.message).join('\n'),
        issues
      )
    }

    const targets = resolveUjatDevAutofillTargets()
    const restore = snapshotStores(targets)
    try {
      applyOverlays(fixture, targets)
    } catch (error) {
      restore()
      throw new UjatDevAutofillError(
        'APPLY_FAILED',
        error instanceof Error ? error.message : '자동입력 적용 중 오류가 발생했습니다.'
      )
    }
    const manualInputRequired = [...fixture.manualInputRequired]
    publishApplicationDrafts(fixture, targets, manualInputRequired)

    return {
      caseId: options.caseId,
      caseLabel: UJAT_DEV_AUTOFILL_CASE_LABELS[options.caseId],
      businessYear: options.businessYear,
      programManagementName: String(fixture.registration['ujat.basicInfo.programManagementName']),
      sponsorId: String(fixture.registration['ujat.basicInfo.sponsorId']),
      sponsorContactId: String(fixture.registration['ujat.basicInfo.sponsorContactId']),
      targets,
      manualInputRequired,
      incompleteRequiredFields: listIncompleteUjatProgramRegistrationWizardRequiredFields(),
    }
  } finally {
    running = false
  }
}
