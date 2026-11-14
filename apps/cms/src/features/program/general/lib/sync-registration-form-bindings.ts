import {
  readFormVersionStatus,
  resolveProgramFormWritePlan,
} from '@/features/template/lib/program-form-version-write-guard'
import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import type { ProgramFormBindingRequest } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingRequest'
import type { ProgramFormBindingResponse } from '@/shared/api/generated/forms-surveys/schemas/programFormBindingResponse'
import type { Program } from '@/types/domain'
import {
  createGeneralProgramFormBinding,
  fetchGeneralProgramFormBindings,
  updateGeneralProgramFormBinding,
} from '@/features/program/general/api/admin-general-programs-service'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { shouldUseProgramsHttpRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { queryClient } from '@/shared/lib/query-client'
import { shouldUseRemoteApi as shouldUseUjatProgramsRemoteApi } from '@/features/program/ujat/api/capabilities'
import {
  getOperationalFormSpec,
  getRegistrationFormSpec,
  isRegistrationCatalogTemplateId,
  isSystemCatalogOnlyFormType,
  isSystemCatalogOnlyTemplateCode,
  REGISTRATION_GENERAL_CATALOG_TEMPLATE_ID,
  pickOperationalFormBinding,
  programForApplicationFormEditor,
  programFormBindingSlotKey,
  recruitmentApplicationBindingScope,
  resolveRowApplicationBinding,
  type OperationalFormSpec,
} from '@/features/program/general/lib/operational-form-bindings'
import { getParticipantApplicationEditorVariantForTemplateCode } from '@/features/template/lib/participant-application-template-id'
import {
  copyFormTemplateVersionRemote,
  createFormTemplateVersionRemote,
  fetchFormTemplateVersionRemote,
  updateFormTemplateRemote,
} from '@/features/template/api/form-templates-api-client'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  loadFormTemplateVersionDraftByVersionId,
  publishFormTemplateVersionById,
  resolveFormTemplateCatalogIds,
  saveFormTemplateVersionDraftByVersionId,
  shouldUseFormsSurveysRemoteApi,
} from '@/features/template/api/admin-form-templates-service'
import { coalesceScopedFormDraftForPut } from '@/features/program/general/lib/coalesce-scoped-form-draft-for-put'
import {
  collectSeedPrefixes,
  expectedSeedPrefixesForTemplateCode,
  isForeignSeedDraft,
} from '@/features/program/general/lib/form-seed-prefix'
import {
  canonicalFormBindingTarget,
  resolveFormBindingTargetType,
} from '@/features/program/general/lib/resolve-form-binding-target-type'
import type { ApplicationCountResponse } from '@/shared/api/generated/dashboard/schemas/applicationCountResponse'
import { fetchProgramApplicationCountsRemote } from '@/features/program/general/api/application-counts-api-client'
import { PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE } from '@/shared/lib/program-edit-window-error-message'

type RememberedBinding = { templateId: number; templateVersionId: number }

export type ApplicationFormLoadSource = {
  templateVersionId?: number
  preferLocalDraft: boolean
  unavailableReason?: string
}

const rememberedByProgram = new Map<string, Map<string, RememberedBinding>>()
const FORM_BINDINGS_STALE_MS = 30_000

function hasApplicationCount(count: ApplicationCountResponse): boolean | undefined {
  if (typeof count.totalCount === 'number' && Number.isFinite(count.totalCount)) {
    return count.totalCount > 0
  }

  const statusCounts = [
    count.submittedCount,
    count.approvedCount,
    count.rejectedCount,
    count.waitingCount,
  ].filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (statusCounts.length === 0) return undefined
  return statusCounts.some(value => value > 0)
}

async function fetchProgramApplicationCountsCached(
  programId: string
): Promise<ApplicationCountResponse[]> {
  return queryClient.fetchQuery({
    queryKey: generalProgramQueryKeys.applicationCounts(programId),
    queryFn: () => fetchProgramApplicationCountsRemote(programId),
    // A stale zero would recreate the orphan-version bug. This is an imperative
    // write guard, so keep the query key for deduplication but always revalidate.
    staleTime: 0,
    retry: false,
  })
}

async function fetchProgramFormBindingsCached(programId: string, options?: { fresh?: boolean }) {
  const queryKey = generalProgramQueryKeys.formBindings(programId)
  if (options?.fresh) {
    await queryClient.invalidateQueries({ queryKey })
  }
  return queryClient.fetchQuery({
    queryKey,
    queryFn: () => fetchGeneralProgramFormBindings(programId),
    staleTime: FORM_BINDINGS_STALE_MS,
  })
}

export function invalidateProgramFormBindingsCache(programId: string): void {
  void queryClient.invalidateQueries({ queryKey: generalProgramQueryKeys.formBindings(programId) })
}

/**
 * Lock APPLICATION writes from recruitment application counts, not from whether
 * a form-binding row already exists. Missing or inactive bindings still cannot
 * be created once the target recruitment (or an unscoped same-targetType row)
 * already has applications.
 */
function scopedProgramForApplicationForm(program: Program, templateCode: string): Program {
  const variant = getParticipantApplicationEditorVariantForTemplateCode(templateCode)
  return variant != null ? programForApplicationFormEditor(program, variant) : program
}

function countHasRecruitmentId(count: ApplicationCountResponse): boolean {
  return count.recruitmentId != null && Number.isFinite(Number(count.recruitmentId))
}

function applicationCountMatchesTarget(args: {
  count: ApplicationCountResponse
  scopeTargetScopeId?: number
  expectedTargetType: string
}): boolean {
  const { count, scopeTargetScopeId, expectedTargetType } = args
  if (
    scopeTargetScopeId != null &&
    countHasRecruitmentId(count) &&
    Number(count.recruitmentId) === scopeTargetScopeId
  ) {
    return true
  }
  if (!countHasRecruitmentId(count) && expectedTargetType !== '') {
    return (
      canonicalFormBindingTarget(count.targetType) ===
      canonicalFormBindingTarget(expectedTargetType)
    )
  }
  return false
}

export async function assertProgramApplicationFormWritable(
  program: Program,
  templateCode: string
): Promise<void> {
  if (!shouldUseProgramFormBindingsRemoteApi() || !shouldUseFormsSurveysRemoteApi()) return

  const spec = getOperationalFormSpec(templateCode)
  if (spec == null || spec.formType.trim().toUpperCase() !== 'APPLICATION') return

  const scopedProgram = scopedProgramForApplicationForm(program, templateCode)
  const scope = recruitmentApplicationBindingScope(scopedProgram, spec.formType)
  const expectedTargetType = spec.targetRole
    ? resolveFormBindingTargetType(spec.targetRole).trim().toUpperCase()
    : ''

  const counts = await fetchProgramApplicationCountsCached(scopedProgram.id)
  const targetCounts = counts.filter(count =>
    applicationCountMatchesTarget({
      count,
      scopeTargetScopeId: scope?.targetScopeId,
      expectedTargetType,
    })
  )
  for (const count of targetCounts) {
    const hasApplications = hasApplicationCount(count)
    if (hasApplications == null) {
      throw new Error('신청서 현황을 확인하지 못해 양식을 수정할 수 없습니다. 다시 시도해 주세요.')
    }
    if (hasApplications) {
      throw new Error(PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE)
    }
  }
}

function shouldUseProgramFormBindingsRemoteApi(): boolean {
  return shouldUseProgramsHttpRemoteApi() || shouldUseUjatProgramsRemoteApi()
}

export function getRememberedProgramOperationalFormBinding(
  programId: string,
  templateCode: string
): RememberedBinding | undefined {
  return rememberedByProgram.get(programId)?.get(templateCode)
}

export function rememberProgramOperationalFormBinding(
  programId: string,
  templateCode: string,
  ids: RememberedBinding
): void {
  const byCode = rememberedByProgram.get(programId) ?? new Map<string, RememberedBinding>()
  byCode.set(templateCode, ids)
  rememberedByProgram.set(programId, byCode)
}

function bindingToUpdatePayload(
  binding: ProgramFormBindingResponse,
  ids: RememberedBinding,
  spec: OperationalFormSpec,
  program?: Program
): ProgramFormBindingRequest {
  const scope = program ? recruitmentApplicationBindingScope(program, spec.formType) : undefined
  return sanitizeProgramFormBindingPayload(program, {
    formType: binding.formType ?? spec.formType,
    templateId: ids.templateId,
    templateVersionId: ids.templateVersionId,
    targetType:
      spec.targetRole != null && spec.targetRole !== ''
        ? resolveFormBindingTargetType(spec.targetRole)
        : binding.targetType,
    targetRole: spec.targetRole ?? binding.targetRole,
    targetScope: scope?.targetScope ?? binding.targetScope,
    targetScopeId: scope?.targetScopeId ?? binding.targetScopeId,
    required: binding.required,
    active: true,
    displayOrder: binding.displayOrder,
  })
}

function selectBindingForOperationalSpec(
  program: Program,
  bindings: readonly ProgramFormBindingResponse[],
  spec: OperationalFormSpec,
  catalogTemplateId?: number
): ProgramFormBindingResponse | undefined {
  const row = resolveRowApplicationBinding(program, bindings, spec)
  if (row.kind === 'missing') return undefined
  if (row.kind === 'binding') return row.binding
  const scopedId = program.activeRecruitmentId
  if (scopedId != null) {
    const byScope = bindings.find(
      item =>
        item.active !== false &&
        String(item.formType ?? '').trim().toUpperCase() === spec.formType &&
        item.targetScopeId === scopedId
    )
    if (byScope != null) return byScope
  }
  return pickOperationalFormBinding(bindings, { ...spec, catalogTemplateId })
}

function withRecruitmentApplicationScope(
  program: Program,
  spec: OperationalFormSpec,
  payload: ProgramFormBindingRequest
): ProgramFormBindingRequest {
  const programType = program.backendProgramType?.trim().toUpperCase()
  if (programType === 'UJAT' && spec.formType === 'APPLICATION') {
    return sanitizeProgramFormBindingPayload(program, payload)
  }
  const scoped = recruitmentApplicationBindingScope(program, spec.formType)
  if (scoped == null) return sanitizeProgramFormBindingPayload(program, payload)
  return sanitizeProgramFormBindingPayload(program, { ...payload, ...scoped })
}

function sanitizeProgramFormBindingPayload(
  program: Program | undefined,
  payload: ProgramFormBindingRequest
): ProgramFormBindingRequest {
  const next: ProgramFormBindingRequest & { recruitments?: unknown } = { ...payload }
  delete next.recruitments
  if (program?.backendProgramType?.trim().toUpperCase() === 'COMPANY_SCHOOL') {
    delete next.targetScope
    delete next.targetScopeId
  }
  return next
}

/** 숫자 프로그램 ID만 ownerProgramId로 쓴다(로컬 임시 ID는 제외). */
function toOwnerProgramId(programId: string | number | null | undefined): number | undefined {
  const n = Number(programId)
  return Number.isSafeInteger(n) && n > 0 ? n : undefined
}

function isCopyFromNonCatalogOriginalError(error: unknown): boolean {
  const message = extractCopyErrorMessage(error)
  return message.includes('카탈로그 원본에서만')
}

function isRegistrationCatalogCopyPolicyError(error: unknown): boolean {
  if (isRegistrationCatalogTemplateId((error as { templateId?: number })?.templateId)) {
    return true
  }
  const status = (error as { response?: { status?: number } })?.response?.status
  const message = extractCopyErrorMessage(error)
  if (status !== 400) return false
  return (
    /REGISTRATION|등록 양식|시스템 제공/i.test(message) ||
    message.includes('프로그램 전용 COPY 대상이 아닙니다')
  )
}

function extractCopyErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const data = (error as { response?: { data?: { error?: { message?: string }; message?: string } } })
      .response?.data
    const nested = data?.error?.message?.trim()
    if (nested) return nested
    const top = data?.message?.trim()
    if (top) return top
  }
  return error instanceof Error ? error.message : ''
}

async function createDraftVersionOnTemplate(
  templateId: number,
  programId: string | number,
  sourceVersionId: number
): Promise<number> {
  const created = await createFormTemplateVersionRemote(templateId, {
    versionLabel: `program-${programId}`,
    sourceVersionId,
  })
  if (created.templateVersionId == null) {
    throw new Error('프로그램 전용 양식 초안을 만들지 못했습니다.')
  }
  return created.templateVersionId
}

/** 사용자 문구는 기존 양식 적용 실패 문구를 그대로 쓴다(새 문구 추가 금지). */
const FORM_APPLY_FAILED_MESSAGE = '양식 적용에 실패했습니다.'

/**
 * PUT 대상 검증 — 다른 양식의 seed 본문(draft) 또는 다른 양식의 버전(baseline)이면 PUT하지 않는다.
 * 예: 강사 신청 draft를 참여자 신청 복사본(2726)에 보내 FOREIGN_PROTECTED_ID 409가 나는 것 사전 차단.
 */
function assertSeedPrefixMatchesTemplate(args: {
  templateCode: string
  versionId: number
  draft: WritingFormDraft | null | undefined
  source: 'draft' | 'baseline'
}): void {
  const expected = expectedSeedPrefixesForTemplateCode(args.templateCode)
  if (!isForeignSeedDraft(args.draft, expected)) return
  console.error('[program-form-bindings] seed 접두어 불일치 — PUT하지 않음', {
    templateCode: args.templateCode,
    versionId: args.versionId,
    source: args.source,
    expectedSeedPrefixes: [...expected],
    actualSeedPrefixes: [...collectSeedPrefixes(args.draft)],
  })
  throw new Error(FORM_APPLY_FAILED_MESSAGE)
}

function isFormVersionImmutableError(error: unknown): boolean {
  const code = getApiErrorCode(error)
  return code === 'FORM_VERSION_IMMUTABLE' || code === 'FORM_CATALOG_VERSION_IMMUTABLE'
}

const REGISTRATION_CATALOG_COPY_FORBIDDEN_MESSAGE =
  '등록 양식 저장에 실패했습니다.\n관리자에게 문의해 주세요.'

async function copyCatalogOperationalFormVersion(args: {
  sourceTemplateId: number
  sourceVersionId: number
  programId: string | number
  ownerProgramId?: number
}): Promise<{ templateId: number; templateVersionId: number; versionStatus?: string | null }> {
  if (isRegistrationCatalogTemplateId(args.sourceTemplateId)) {
    throw new Error(REGISTRATION_CATALOG_COPY_FORBIDDEN_MESSAGE)
  }
  const copyOwnerProgramId = args.ownerProgramId ?? toOwnerProgramId(args.programId)
  try {
    const copied = await copyFormTemplateVersionRemote(args.sourceTemplateId, {
      sourceVersionId: args.sourceVersionId,
      versionLabel: `program-${args.programId}`,
      ...(copyOwnerProgramId != null ? { ownerProgramId: copyOwnerProgramId } : {}),
    })
    if (copied.templateVersionId == null) {
      throw new Error('프로그램 전용 양식 초안을 만들지 못했습니다.')
    }
    return {
      templateId: copied.templateId ?? args.sourceTemplateId,
      templateVersionId: copied.templateVersionId,
      versionStatus: copied.versionStatus ?? null,
    }
  } catch (error) {
    const code = getApiErrorCode(error)
    if (code === 'DATABASE_ERROR') {
      console.warn('[program-form-bindings] copyVersion DATABASE_ERROR — copy 재시도 없음', {
        templateId: args.sourceTemplateId,
        sourceVersionId: args.sourceVersionId,
        ownerProgramId: copyOwnerProgramId,
      })
      throw error
    }
    if (isRegistrationCatalogCopyPolicyError(error)) {
      throw new Error(REGISTRATION_CATALOG_COPY_FORBIDDEN_MESSAGE)
    }
    if (isCopyFromNonCatalogOriginalError(error)) {
      const draftVersionId = await createDraftVersionOnTemplate(
        args.sourceTemplateId,
        args.programId,
        args.sourceVersionId
      )
      return { templateId: args.sourceTemplateId, templateVersionId: draftVersionId, versionStatus: 'DRAFT' }
    }
    throw error
  }
}

/**
 * 프로그램 상세 신청 양식 저장.
 * 바인딩된 버전은 PUBLISHED·카탈로그라 PUT이 409 FORM_VERSION_IMMUTABLE 또는 FORM_CATALOG_VERSION_IMMUTABLE이다.
 * 발행본이면 새 DRAFT로 복사한 뒤 저장·발행하고, 그 버전으로 바인딩을 교체한다.
 */
const inFlightProgramFormSaves = new Map<
  string,
  Promise<RememberedBinding & { bindingId?: number }>
>()

export async function saveProgramScopedOperationalFormVersion(input: {
  program: Program
  templateCode: string
  versionId: number
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
  /** CREATE 직후 양식 적용 — COPY를 이 프로그램 소유(`ownerProgramId`)로 만든다. */
  ownerProgramId?: number
  /**
   * 같은 templateCode를 이미 COPY·발행한 경우(UJAT 봉사자 상·하반기 행).
   * 추가 COPY 없이 이 버전으로 바인딩만 붙인다.
   */
  reusePublished?: { templateId: number; templateVersionId: number }
  /**
   * 같은 적용 실행에서 이미 다른 양식이 차지한 바인딩. 여기 있으면 PATCH하지 않고 새 바인딩을 만든다.
   * (1사1교: BE 자동 적용은 모집·신청 바인딩을 1개씩만 만든다 → 기관/강사 양식이 같은 바인딩을 덮어쓰는 것 방지)
   */
  excludeBindingIds?: ReadonlySet<number>
}): Promise<RememberedBinding & { bindingId?: number }> {
  const saveKey = `${input.program.id}:${input.templateCode}:${input.versionId}`
  const pending = inFlightProgramFormSaves.get(saveKey)
  if (pending != null) return pending

  const run = saveProgramScopedOperationalFormVersionOnce(input).finally(() => {
    if (inFlightProgramFormSaves.get(saveKey) === run) {
      inFlightProgramFormSaves.delete(saveKey)
    }
  })
  inFlightProgramFormSaves.set(saveKey, run)
  return run
}

async function saveProgramScopedOperationalFormVersionOnce(input: {
  program: Program
  templateCode: string
  versionId: number
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
  ownerProgramId?: number
  reusePublished?: { templateId: number; templateVersionId: number }
  excludeBindingIds?: ReadonlySet<number>
}): Promise<RememberedBinding & { bindingId?: number }> {
  const args = {
    ...input,
    program: scopedProgramForApplicationForm(input.program, input.templateCode),
  }
  const spec =
    getOperationalFormSpec(args.templateCode) ?? getRegistrationFormSpec(args.templateCode)
  if (spec == null) {
    throw new Error(`운영 양식 스펙을 찾을 수 없습니다: ${args.templateCode}`)
  }
  const catalog = await resolveFormTemplateCatalogIds(args.templateCode).catch(() => null)
  if (
    isSystemCatalogOnlyFormType(spec.formType) ||
    isSystemCatalogOnlyTemplateCode(args.templateCode)
  ) {
    return {
      templateId: catalog?.templateId ?? REGISTRATION_GENERAL_CATALOG_TEMPLATE_ID,
      templateVersionId: catalog?.templateVersionId ?? args.versionId,
    }
  }
  // 다른 양식 본문이면 COPY 전에 막는다 — 고아 DRAFT 복사본을 남기지 않는다.
  if (args.reusePublished == null) {
    assertSeedPrefixMatchesTemplate({
      templateCode: args.templateCode,
      versionId: args.versionId,
      draft: args.draft,
      source: 'draft',
    })
  }
  // Do this before fetching or mutating a template version. A binding PATCH
  // can be rejected after recruitment applications exist; the preflight keeps
  // that rejection from leaving a copied/published orphan version behind.
  await assertProgramApplicationFormWritable(args.program, args.templateCode)

  let draftTemplateId: number
  let publishedVersionId: number

  if (args.reusePublished != null) {
    draftTemplateId = args.reusePublished.templateId
    publishedVersionId = args.reusePublished.templateVersionId
  } else {
    const current = await fetchFormTemplateVersionRemote(args.versionId)
    const sourceTemplateId = current.templateId
    if (sourceTemplateId == null) {
      throw new Error('양식 버전의 템플릿 ID를 찾을 수 없습니다.')
    }

    let draftVersionId = args.versionId
    draftTemplateId = sourceTemplateId
    const plan = resolveProgramFormWritePlan(current, {
      catalogTemplateId: catalog?.templateId,
      programId: args.program.id,
    })
    const copySource = (): {
      sourceTemplateId: number
      sourceVersionId: number
    } | null => {
      if (isRegistrationCatalogTemplateId(sourceTemplateId)) return null
      if (isRegistrationCatalogTemplateId(catalog?.templateId)) return null
      const copyFromOperationalCatalog =
        catalog?.templateId != null &&
        catalog.templateId !== sourceTemplateId &&
        catalog.templateVersionId != null &&
        !isRegistrationCatalogTemplateId(catalog.templateId)
      return {
        sourceTemplateId: copyFromOperationalCatalog ? catalog.templateId : sourceTemplateId,
        sourceVersionId: copyFromOperationalCatalog ? catalog.templateVersionId : args.versionId,
      }
    }
    const runCopy = async () => {
      const source = copySource()
      if (source == null) return null
      return copyCatalogOperationalFormVersion({
        ...source,
        programId: args.program.id,
        ownerProgramId: args.ownerProgramId,
      })
    }

    if (plan.action === 'copy-from-catalog' || plan.action === 'create-draft-version') {
      if (isRegistrationCatalogTemplateId(sourceTemplateId) || isRegistrationCatalogTemplateId(catalog?.templateId)) {
        return {
          templateId: catalog?.templateId ?? sourceTemplateId,
          templateVersionId: catalog?.templateVersionId ?? args.versionId,
        }
      }
      const copied = await runCopy()
      if (copied != null) {
        draftTemplateId = copied.templateId
        draftVersionId = copied.templateVersionId
        if (String(copied.versionStatus ?? '').toUpperCase() === 'PUBLISHED') {
          const recopy = await runCopy()
          if (recopy != null) {
            draftTemplateId = recopy.templateId
            draftVersionId = recopy.templateVersionId
          }
        }
      } else if (plan.action === 'create-draft-version') {
        draftVersionId = await createDraftVersionOnTemplate(
          sourceTemplateId,
          args.program.id,
          args.versionId
        )
      }
    }

    const putDraft = async (versionId: number) => {
      const baseline = await loadFormTemplateVersionDraftByVersionId(args.templateCode, versionId)
      // 대상 버전이 이 templateCode의 양식인지 확인한다(다른 양식 복사본 versionId로 PUT 금지).
      assertSeedPrefixMatchesTemplate({
        templateCode: args.templateCode,
        versionId,
        draft: baseline?.draft,
        source: 'baseline',
      })
      const draftForPut =
        baseline?.draft != null ? coalesceScopedFormDraftForPut(baseline.draft, args.draft) : args.draft
      await saveFormTemplateVersionDraftByVersionId({
        versionId,
        draft: draftForPut,
        overlay: args.overlay,
        editorState: args.editorState,
        settingsJson: args.settingsJson,
        templateCode: args.templateCode,
      })
    }

    try {
      await putDraft(draftVersionId)
    } catch (error) {
      if (!isFormVersionImmutableError(error)) throw error
      const recopy = await runCopy()
      if (recopy == null) throw error
      draftTemplateId = recopy.templateId
      draftVersionId = recopy.templateVersionId
      await putDraft(draftVersionId)
    }

    publishedVersionId = await publishFormTemplateVersionById(draftVersionId)
    if (catalog != null && draftTemplateId !== catalog.templateId) {
      try {
        const userFormDescription = args.draft.paragraphs
          .map(paragraph => paragraph.paragraphDescription?.trim())
          .find(text => Boolean(text))
        await updateFormTemplateRemote(draftTemplateId, {
          description: userFormDescription || `program-scoped:${args.program.id}`,
        })
      } catch (error) {
        console.warn('[program-form-bindings] label program-scoped template failed', error)
      }
    }
  }

  const ids = { templateId: draftTemplateId, templateVersionId: publishedVersionId }
  const bindings = await fetchGeneralProgramFormBindings(args.program.id)
  const selected = selectBindingForOperationalSpec(
    args.program,
    bindings,
    spec,
    catalog?.templateId
  )
  const existing =
    selected?.bindingId != null && args.excludeBindingIds?.has(Number(selected.bindingId))
      ? undefined
      : selected
  const createPayload = withRecruitmentApplicationScope(args.program, spec, {
    formType: spec.formType,
    templateId: draftTemplateId,
    templateVersionId: publishedVersionId,
    active: true,
    required: false,
  })
  if (spec.targetRole != null && spec.targetRole !== '') {
    createPayload.targetRole = spec.targetRole
    createPayload.targetType = resolveFormBindingTargetType(spec.targetRole)
  }
  if (existing?.targetScope != null && existing.targetScope !== '') {
    createPayload.targetScope = existing.targetScope
    createPayload.targetScopeId = existing.targetScopeId
  } else if (
    spec.formType === 'RECRUITMENT' &&
    args.program.backendProgramType?.trim().toUpperCase() === 'UJAT' &&
    spec.targetRole === 'VOLUNTEER' &&
    (args.program.activeRecruitmentId === 1 || args.program.activeRecruitmentId === 2)
  ) {
    createPayload.targetScope = 'TERM'
    createPayload.targetScopeId = args.program.activeRecruitmentId
  }

  const existingAudience =
    canonicalFormBindingTarget(existing?.targetType) ||
    canonicalFormBindingTarget(existing?.targetRole)
  const specAudience =
    spec.targetRole != null && spec.targetRole !== ''
      ? canonicalFormBindingTarget(spec.targetRole)
      : ''
  const existingAudienceMismatch =
    existing?.bindingId != null &&
    specAudience !== '' &&
    existingAudience !== '' &&
    existingAudience !== specAudience
  const existingSlotKey = existing != null ? programFormBindingSlotKey(existing) : ''
  const createSlotKey = programFormBindingSlotKey(createPayload)
  const sameSlot = existingSlotKey !== '' && existingSlotKey === createSlotKey
  if (existing?.bindingId == null || (existingAudienceMismatch && !sameSlot)) {
    await createGeneralProgramFormBinding(args.program.id, createPayload)
  } else {
    await updateGeneralProgramFormBinding(
      args.program.id,
      String(existing.bindingId),
      bindingToUpdatePayload(existing, ids, spec, args.program)
    )
  }
  rememberProgramOperationalFormBinding(args.program.id, args.templateCode, ids)
  invalidateProgramFormBindingsCache(args.program.id)
  const usedBindingId = existing?.bindingId != null ? Number(existing.bindingId) : undefined
  return usedBindingId != null ? { ...ids, bindingId: usedBindingId } : ids
}

/** form-bindings GET + resolve만 (조회·미리보기용, PATCH/PUT 없음) */
export async function resolveProgramOperationalFormLoadSource(
  program: Program,
  templateCode: string
): Promise<{ templateVersionId?: number; preferLocalDraft: boolean }> {
  if (!shouldUseProgramFormBindingsRemoteApi() || !shouldUseFormsSurveysRemoteApi()) {
    return { preferLocalDraft: true }
  }
  const catalog = await resolveFormTemplateCatalogIds(templateCode)
  const bindings = await fetchProgramFormBindingsCached(program.id)
  const source = resolveApplicationFormLoadSource({
    programId: program.id,
    program,
    templateCode,
    bindings,
    catalogTemplateId: catalog?.templateId,
  })
  if (source.templateVersionId != null) return source

  // 위저드는 카탈로그 공유 바인딩을 local draft로 두지만, 이미 등록된 프로그램 상세는
  // 같은 templateId여도 binding version(등록 시 작성본)을 읽어야 한다.
  const spec = getOperationalFormSpec(templateCode)
  if (spec == null) return source
  const binding = pickOperationalFormBinding(bindings, {
    ...spec,
    catalogTemplateId: catalog?.templateId,
  })
  if (binding?.templateVersionId == null) return source
  return { templateVersionId: binding.templateVersionId, preferLocalDraft: false }
}

/** 발행·보관·상태 불명 버전은 PUT 불가. DRAFT만 수정한다. */
export function isProgramFormVersionMutable(versionStatus: string | null | undefined): boolean {
  return readFormVersionStatus({ versionStatus }) === 'DRAFT'
}

/**
 * 신청 양식 로드 소스만 맞춘다. COPY/publish/form-binding POST는 저장 경로에서만 수행한다.
 */
export async function ensureProgramScopedOperationalBinding(
  inputProgram: Program,
  templateCode: string,
  options?: { strictRemote?: boolean }
): Promise<ApplicationFormLoadSource> {
  const program = scopedProgramForApplicationForm(inputProgram, templateCode)
  const strictRemote = options?.strictRemote === true
  if (!shouldUseProgramFormBindingsRemoteApi() || !shouldUseFormsSurveysRemoteApi()) {
    return strictRemote
      ? {
          preferLocalDraft: false,
          unavailableReason: '원격 신청 양식 API가 활성화되지 않았습니다.',
        }
      : { preferLocalDraft: true }
  }
  const spec = getOperationalFormSpec(templateCode)
  if (spec == null) {
    return strictRemote
      ? { preferLocalDraft: false, unavailableReason: '신청 양식 계약을 찾을 수 없습니다.' }
      : { preferLocalDraft: true }
  }
  const catalog = await resolveFormTemplateCatalogIds(templateCode)
  const bindings = await fetchProgramFormBindingsCached(program.id)
  return resolveApplicationFormLoadSource({
    programId: program.id,
    program,
    templateCode,
    bindings,
    catalogTemplateId: catalog?.templateId,
    strictRemote,
  })
}

export function resolveApplicationFormLoadSource(args: {
  programId: string
  templateCode: string
  bindings: readonly ProgramFormBindingResponse[]
  catalogTemplateId?: number
  program?: Program
  strictRemote?: boolean
}): ApplicationFormLoadSource {
  const strictRemote = args.strictRemote === true
  const spec = getOperationalFormSpec(args.templateCode)
  const rowScoped =
    args.program != null &&
    spec != null &&
    recruitmentApplicationBindingScope(args.program, spec.formType) != null
  if (!rowScoped && !strictRemote) {
    const remembered = getRememberedProgramOperationalFormBinding(args.programId, args.templateCode)
    if (remembered?.templateVersionId != null) {
      return { templateVersionId: remembered.templateVersionId, preferLocalDraft: false }
    }
  }
  if (spec == null) {
    return strictRemote
      ? { preferLocalDraft: false, unavailableReason: '신청 양식 계약을 찾을 수 없습니다.' }
      : { preferLocalDraft: true }
  }
  if (rowScoped && args.program != null) {
    const row = resolveRowApplicationBinding(args.program, args.bindings, spec)
    if (row.kind !== 'binding' || row.binding.templateVersionId == null) {
      return strictRemote
        ? { preferLocalDraft: false, unavailableReason: '신청 양식 바인딩이 없습니다.' }
        : { preferLocalDraft: true }
    }
    return { templateVersionId: row.binding.templateVersionId, preferLocalDraft: false }
  }
  const binding = pickOperationalFormBinding(args.bindings, {
    ...spec,
    // strict remote에서는 catalog 여부와 무관하게 API가 반환한 binding version을 사용한다.
    catalogTemplateId: strictRemote ? undefined : args.catalogTemplateId,
  })
  if (strictRemote) {
    return binding?.templateVersionId != null
      ? { templateVersionId: binding.templateVersionId, preferLocalDraft: false }
      : { preferLocalDraft: false, unavailableReason: '신청 양식 바인딩이 없습니다.' }
  }
  if (
    binding?.templateVersionId != null &&
    (binding.templateId == null ||
      args.catalogTemplateId == null ||
      binding.templateId !== args.catalogTemplateId)
  ) {
    return { templateVersionId: binding.templateVersionId, preferLocalDraft: false }
  }
  return { preferLocalDraft: true }
}
