import type { Program } from '@/types/domain'
import {
  applyGeneralRegistrationOverlayToProgram,
  type GeneralRegistrationEditorExtras,
} from '@/features/program/general/lib/registration-overlay-to-program'
import {
  buildGeneralRegistrationOverlayFromProgram,
  resyncGeneralRegistrationOverlayFromProgram,
} from '@/features/program/general/lib/registration-overlay-sync'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import {
  keyMatchesOperationalOverlayPrefixes,
  operationalOverlayKeyPrefixesForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { RECRUIT_DETAIL_INFO_OVERLAY_PREFIX } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-overlay'
import {
  isEphemeralThumbPreviewUrl,
  readRecruitDetailMediaFromOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { parseFileObjectId } from '@/shared/lib/admin-file-upload'
import type {
  ApplicationBindingCatalogId,
  ApplicationBindingDraft,
  BuildApplicationBindingDraftsInput,
  BuildCommonInfoDraftInput,
  BuildMediaSidecarInput,
  BuildProgramEditSnapshotInput,
  BuildRecruitmentDraftsInput,
  CommonInfoDraft,
  MediaBindCall,
  MediaFileOrigin,
  MediaSidecar,
  ProgramEditSnapshot,
  RecruitmentCatalogDraft,
  SnapshotInputOverlay,
} from './program-edit-snapshot.types'
import {
  APPLICATION_BINDING_CATALOG_IDS,
  DEFAULT_RECRUITMENT_CATALOG_IDS,
} from './program-edit-snapshot.types'

const GENERAL_ROW_DETAIL_INFO_PREFIX: Record<string, string> = {
  PARTICIPANT: RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.institution,
  INSTRUCTOR: 'recruitInstructor.detailInfo',
  VOLUNTEER: RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.volunteer,
}

export function pickOverlayKeysByPrefixes(
  record: SnapshotInputOverlay,
  prefixes: readonly string[]
): SnapshotInputOverlay {
  if (prefixes.length === 0) return {}
  const out: SnapshotInputOverlay = {}
  for (const [key, value] of Object.entries(record)) {
    if (keyMatchesOperationalOverlayPrefixes(key, prefixes)) out[key] = value
  }
  return out
}

function withExtrasColumns(program: Program, extras: GeneralRegistrationEditorExtras): Program {
  return {
    ...program,
    generalProgramEducationStructure: extras.programType,
    generalProgramSessionRound: extras.sessionRoundType,
  }
}

export function buildCommonInfoDraft(input: BuildCommonInfoDraftInput): CommonInfoDraft {
  const applied = applyGeneralRegistrationOverlayToProgram(
    input.baseline,
    input.overlay,
    input.extras
  )
  const program = withExtrasColumns(applied, input.extras)
  return {
    applied,
    program,
    inputOverlay: input.overlay,
    resyncedOverlay: resyncGeneralRegistrationOverlayFromProgram(program, input.overlay),
    extras: input.extras,
  }
}

export function seedCommonInfoOverlayFromProgram(program: Program): SnapshotInputOverlay {
  return buildGeneralRegistrationOverlayFromProgram(program)
}

export function buildRecruitmentDrafts(
  input: BuildRecruitmentDraftsInput
): RecruitmentCatalogDraft[] {
  const catalogIds = input.catalogIds ?? DEFAULT_RECRUITMENT_CATALOG_IDS
  return catalogIds.map(catalogId => {
    const prefixes = operationalOverlayKeyPrefixesForCatalogId(catalogId)
    const raw = input.overlaysByCatalog[catalogId] ?? {}
    return {
      catalogId,
      prefixes,
      overlay: pickOverlayKeysByPrefixes(raw, prefixes),
    }
  })
}

export function mergeRecruitmentOverlays(
  drafts: readonly RecruitmentCatalogDraft[]
): SnapshotInputOverlay {
  const merged: SnapshotInputOverlay = {}
  for (const draft of drafts) {
    Object.assign(merged, draft.overlay)
  }
  return merged
}

export function applyRecruitmentDraftsToProgram(
  program: Program,
  drafts: readonly RecruitmentCatalogDraft[]
): Program {
  const overlay = mergeRecruitmentOverlays(drafts)
  if (Object.keys(overlay).length === 0) return program
  return applyGeneralRecruitOverlayToProgram(program, overlay, { preferOverlay: true })
}

export function buildApplicationBindingDrafts(
  input: BuildApplicationBindingDraftsInput
): ApplicationBindingDraft[] {
  return APPLICATION_BINDING_CATALOG_IDS.map(catalogId => {
    const prefixes = operationalOverlayKeyPrefixesForCatalogId(catalogId)
    const raw = input.overlaysByCatalog[catalogId] ?? {}
    return {
      catalogId,
      prefixes,
      overlay: pickOverlayKeysByPrefixes(raw, prefixes),
      sink: 'form-version-overlay',
    }
  })
}

function mediaOrigin(state: {
  thumbObjectUrl?: string
  thumbFileObjectId?: number
}): MediaFileOrigin {
  if (state.thumbFileObjectId != null) return 'uploaded-object-id'
  if (isEphemeralThumbPreviewUrl(state.thumbObjectUrl)) return 'ephemeral-blob'
  return 'empty'
}

export function buildMediaSidecar(input: BuildMediaSidecarInput): MediaSidecar {
  const media = readRecruitDetailMediaFromOverlay(input.overlay)
  const state = {
    origin: mediaOrigin(media),
    ...media,
  }
  return {
    state,
    bindCalls: input.created ? mediaBindCallsFromCreated(input.created, input.overlay) : [],
  }
}

export function mediaBindCallsFromCreated(
  created: Pick<Program, 'id' | 'programRecruitments'>,
  overlay: SnapshotInputOverlay
): MediaBindCall[] {
  const programId = parseFileObjectId(created.id)
  if (programId == null) return []
  const rows = (created.programRecruitments ?? []).filter(row => row.id != null)
  if (rows.length === 0) {
    return programBindCalls(programId, overlay)
  }
  const calls: MediaBindCall[] = []
  for (const row of rows) {
    const prefix = GENERAL_ROW_DETAIL_INFO_PREFIX[(row.recruitmentType ?? '').toUpperCase()]
    if (!prefix) continue
    const media = readRecruitDetailMediaFromOverlay(overlay, [prefix])
    if (media.thumbFileObjectId != null) {
      calls.push({
        kind: 'putProgramRecruitmentThumbnail',
        programId,
        recruitmentId: row.id,
        fileObjectId: media.thumbFileObjectId,
      })
    }
    const attachmentIds = media.attachmentFileObjectIds ?? []
    if (attachmentIds.length > 0) {
      calls.push({
        kind: 'putProgramRecruitmentAttachments',
        programId,
        recruitmentId: row.id,
        fileObjectIds: attachmentIds,
      })
    }
  }
  return calls
}

function programBindCalls(programId: number, overlay: SnapshotInputOverlay): MediaBindCall[] {
  const media = readRecruitDetailMediaFromOverlay(overlay)
  const calls: MediaBindCall[] = []
  if (media.thumbFileObjectId != null) {
    calls.push({
      kind: 'putProgramThumbnail',
      programId,
      fileObjectId: media.thumbFileObjectId,
    })
  }
  const attachmentIds = media.attachmentFileObjectIds ?? []
  if (attachmentIds.length > 0) {
    calls.push({
      kind: 'putProgramAttachments',
      programId,
      fileObjectIds: attachmentIds,
    })
  }
  return calls
}

export function mergeRegistrationAndRecruitOverlay(
  registrationOverlay: SnapshotInputOverlay,
  recruitDrafts: readonly RecruitmentCatalogDraft[]
): SnapshotInputOverlay {
  return {
    ...registrationOverlay,
    ...mergeRecruitmentOverlays(recruitDrafts),
  }
}

export function buildProgramEditSnapshot(
  input: BuildProgramEditSnapshotInput
): ProgramEditSnapshot {
  const commonInfo = buildCommonInfoDraft({
    baseline: input.baseline,
    overlay: input.overlay,
    extras: input.extras,
  })
  const recruitments = buildRecruitmentDrafts({
    overlaysByCatalog: input.recruitOverlaysByCatalog ?? {},
  })
  const applicationBindings = buildApplicationBindingDrafts({
    overlaysByCatalog: input.applicationOverlaysByCatalog ?? {},
  })
  const media = buildMediaSidecar({
    overlay: input.mediaOverlay ?? input.overlay,
    created: input.createdForMedia,
  })
  return {
    commonInfo,
    recruitments,
    applicationBindings,
    media,
    editorExtras: input.extras,
    draftMetadata: {
      mode: input.draftMetadata?.mode ?? 'create',
      programId: input.draftMetadata?.programId ?? input.baseline.id,
      omitUnchangedWage: input.draftMetadata?.omitUnchangedWage,
    },
  }
}

export function isApplicationBindingCatalogId(
  value: string
): value is ApplicationBindingCatalogId {
  return (APPLICATION_BINDING_CATALOG_IDS as readonly string[]).includes(value)
}
