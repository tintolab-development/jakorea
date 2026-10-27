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
import {
  isEphemeralThumbPreviewUrl,
  readRecruitDetailMediaFromOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
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
  _created: Pick<Program, 'id' | 'programRecruitments'>,
  _overlay: SnapshotInputOverlay
): MediaBindCall[] {
  // 신규 등록 미디어는 POST recruitments[] 필드. 생성 직후 모집 행 PUT은 쓰지 않는다.
  return []
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
