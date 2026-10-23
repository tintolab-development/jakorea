/**
 * Phase 1-B — 일반 프로그램 미디어 Independent Builder 입력 계약.
 * overlay store / peek / RHF / PUT API 를 노출하지 않는다.
 */
import type { Program } from '@/types/domain'
import type { MediaBindCall, MediaSidecar, MediaSidecarState } from './program-edit-snapshot.types'

export type IndependentMediaAssetValues = {
  fileObjectId?: number
  fileName?: string
  contentUrl?: string
  objectUrl?: string
}

export type IndependentMediaAttachmentValues = {
  fileObjectIds?: number[]
  fileNames?: string[]
}

export type IndependentMediaPrefixValues = {
  prefix: string
  thumbnail?: IndependentMediaAssetValues
  attachments?: IndependentMediaAttachmentValues
}

export type IndependentMediaFormValues = {
  thumbnail?: IndependentMediaAssetValues
  attachments?: IndependentMediaAttachmentValues
  byPrefix?: readonly IndependentMediaPrefixValues[]
}

export type IndependentMediaSidecars = {
  unownedOverlay?: Record<string, unknown>
  overlayKeyOrder?: readonly string[]
  created?: Pick<Program, 'id' | 'programRecruitments'>
}

export type IndependentMediaBuildInput = {
  formValues: IndependentMediaFormValues
  sidecars?: IndependentMediaSidecars
}

export type IndependentMediaBuildResult = {
  sidecar: MediaSidecar
  persistOverlay: Record<string, unknown>
  state: MediaSidecarState
  bindCalls: MediaBindCall[]
}
