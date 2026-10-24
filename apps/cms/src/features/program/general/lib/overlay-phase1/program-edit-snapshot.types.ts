/**
 * Phase 1-A Snapshot 계약.
 * React / RHF / 전역 overlay store 를 포함하지 않는다.
 * 입력 필드·파생값·파일 상태·저장 결과는 영역별로 구분한다.
 */
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import type { Program } from '@/types/domain'
import type {
  ProgramCreateRequestBody,
  ProgramUpdateRequestBody,
} from '@/features/program/general/api/adapters/general-program-adapters'

export type ApplicationBindingCatalogId =
  | 'application-participant-school'
  | 'application-participant-individual'
  | 'application-instructor'
  | 'application-volunteer'

export const APPLICATION_BINDING_CATALOG_IDS = [
  'application-participant-school',
  'application-participant-individual',
  'application-instructor',
  'application-volunteer',
] as const satisfies readonly ApplicationBindingCatalogId[]

export const DEFAULT_RECRUITMENT_CATALOG_IDS = [
  'recruitment-participant-school',
  'recruitment-participant-individual',
  'recruitment-instructor',
  'recruitment-volunteer',
] as const

/** overlay KV 입력 — 사용자 입력 또는 시드 복원 */
export type SnapshotInputOverlay = Record<string, unknown>

export type CommonInfoDraft = {
  /** applyGeneralRegistrationOverlayToProgram 결과 (컬럼 extras 적용 전) */
  applied: Program
  /** extras.programType / sessionRoundType 컬럼을 붙인 저장 draft */
  program: Program
  /** 호출부 overlay 원본. create persist는 이 값(+ recruit)을 쓴다 */
  inputOverlay: SnapshotInputOverlay
  /** resync 결과. 상세 공통 PATCH persist가 이 값을 쓴다 */
  resyncedOverlay: SnapshotInputOverlay
  extras: GeneralRegistrationEditorExtras
}

export type RecruitmentCatalogDraft = {
  catalogId: string
  prefixes: readonly string[]
  overlay: SnapshotInputOverlay
}

export type ApplicationBindingDraft = {
  catalogId: ApplicationBindingCatalogId
  prefixes: readonly string[]
  overlay: SnapshotInputOverlay
  sink: 'form-version-overlay'
}

export type MediaFileOrigin = 'empty' | 'ephemeral-blob' | 'uploaded-object-id'

export type MediaSidecarState = {
  origin: MediaFileOrigin
  thumbFileObjectId?: number
  thumbFileName?: string
  thumbContentUrl?: string
  /** blob. create payload canonical 아님 */
  thumbObjectUrl?: string
  attachmentFileObjectIds?: number[]
  attachmentFileNames?: string[]
  keyVisualImage?: string
}

export type MediaBindCallKind =
  | 'putProgramThumbnail'
  | 'putProgramAttachments'
  | 'putProgramRecruitmentThumbnail'
  | 'putProgramRecruitmentAttachments'

export type MediaBindCall = {
  kind: MediaBindCallKind
  programId: number
  recruitmentId?: number
  fileObjectId?: number
  fileObjectIds?: number[]
}

export type MediaSidecar = {
  state: MediaSidecarState
  bindCalls: MediaBindCall[]
}

export type ProgramDraftMetadata = {
  mode: 'create' | 'update'
  programId?: string
  omitUnchangedWage?: boolean
}

export type ProgramEditSnapshot = {
  commonInfo: CommonInfoDraft
  recruitments: RecruitmentCatalogDraft[]
  applicationBindings: ApplicationBindingDraft[]
  media: MediaSidecar
  editorExtras: GeneralRegistrationEditorExtras
  draftMetadata: ProgramDraftMetadata
}

export type CommonInfoCreateSave = {
  program: Program
  registrationOverlay: SnapshotInputOverlay
  createRequest: ProgramCreateRequestBody
  serviceDetailJson?: string
}

export type CommonInfoUpdateSave = {
  program: Program
  patch: Partial<Program>
  updateRequest: ProgramUpdateRequestBody
  serviceDetailJson?: string
}

export type BuildCommonInfoDraftInput = {
  baseline: Program
  overlay: SnapshotInputOverlay
  extras: GeneralRegistrationEditorExtras
}

export type BuildRecruitmentDraftsInput = {
  overlaysByCatalog: Record<string, SnapshotInputOverlay>
  catalogIds?: readonly string[]
}

export type BuildApplicationBindingDraftsInput = {
  overlaysByCatalog: Partial<Record<ApplicationBindingCatalogId, SnapshotInputOverlay>>
}

export type BuildMediaSidecarInput = {
  overlay: SnapshotInputOverlay
  created?: Pick<Program, 'id' | 'programRecruitments'>
}

export type BuildProgramEditSnapshotInput = {
  baseline: Program
  overlay: SnapshotInputOverlay
  extras: GeneralRegistrationEditorExtras
  recruitOverlaysByCatalog?: Record<string, SnapshotInputOverlay>
  applicationOverlaysByCatalog?: Partial<
    Record<ApplicationBindingCatalogId, SnapshotInputOverlay>
  >
  mediaOverlay?: SnapshotInputOverlay
  createdForMedia?: Pick<Program, 'id' | 'programRecruitments'>
  draftMetadata?: Partial<ProgramDraftMetadata>
}
