/**
 * Phase 1-B 모집 Independent Snapshot Builder.
 * 기존 모집 overlay apply/merge 및 overlay store / peek / RHF 를 호출하지 않는다.
 */
import {
  keyMatchesOperationalOverlayPrefixes,
  operationalOverlayKeyPrefixesForCatalogId,
} from '@/features/program/general/lib/registration-operational-form-drafts'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import { sanitizeRecruitAnnouncementOverlay } from '@/features/program/general/lib/participant-recruitment-announcement-request'
import { applyIndependentRecruitmentFormValues } from './recruitment-domain'
import { orderOverlayKeys } from './common-info-domain'
import type {
  IndependentRecruitmentBuildInput,
  IndependentRecruitmentBuildResult,
} from './recruitment-form-values'
import { DEFAULT_RECRUITMENT_CATALOG_IDS } from './program-edit-snapshot.types'

const SCHOOL_OWNED_KEYS = new Set<string>([
  ...Object.values(APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS),
])

function pickByPrefixes(
  overlay: Record<string, unknown>,
  prefixes: readonly string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(overlay)) {
    if (keyMatchesOperationalOverlayPrefixes(key, prefixes)) out[key] = value
  }
  return out
}

function pickSchoolCatalogOverlay(overlay: Record<string, unknown>): Record<string, unknown> {
  const fromPrefix = pickByPrefixes(overlay, operationalOverlayKeyPrefixesForCatalogId(
    'recruitment-participant-school'
  ))
  const out = { ...fromPrefix }
  for (const key of SCHOOL_OWNED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(overlay, key)) out[key] = overlay[key]
  }
  return out
}

export function splitIndependentRecruitmentCatalogOverlays(
  overlay: Record<string, unknown>
): Record<string, Record<string, unknown>> {
  return {
    'recruitment-participant-school': pickSchoolCatalogOverlay(overlay),
    'recruitment-participant-individual': pickByPrefixes(
      overlay,
      operationalOverlayKeyPrefixesForCatalogId('recruitment-participant-individual')
    ),
    'recruitment-instructor': pickByPrefixes(
      overlay,
      operationalOverlayKeyPrefixesForCatalogId('recruitment-instructor')
    ),
    'recruitment-volunteer': pickByPrefixes(
      overlay,
      operationalOverlayKeyPrefixesForCatalogId('recruitment-volunteer')
    ),
  }
}

export function mergeIndependentRecruitmentCatalogOverlays(
  catalogs: Record<string, Record<string, unknown>>
): Record<string, unknown> {
  const merged: Record<string, unknown> = {}
  for (const id of DEFAULT_RECRUITMENT_CATALOG_IDS) {
    Object.assign(merged, catalogs[id] ?? {})
  }
  return merged
}

export function buildIndependentRecruitmentDraft(
  input: IndependentRecruitmentBuildInput
): IndependentRecruitmentBuildResult {
  const preferOverlay = input.sidecars?.preferOverlay ?? input.mode === 'create'
  const programDraft = applyIndependentRecruitmentFormValues(
    input.baseline,
    input.formValues,
    input.sidecars,
    preferOverlay
  )
  const sourceOverlay = {
    ...(input.sidecars?.unownedOverlay ?? {}),
    ...mergeIndependentRecruitmentCatalogOverlays(
      input.catalogOverlays
        ? {
            'recruitment-participant-school':
              input.catalogOverlays['recruitment-participant-school'] ?? {},
            'recruitment-participant-individual':
              input.catalogOverlays['recruitment-participant-individual'] ?? {},
            'recruitment-instructor': input.catalogOverlays['recruitment-instructor'] ?? {},
            'recruitment-volunteer': input.catalogOverlays['recruitment-volunteer'] ?? {},
          }
        : splitIndependentRecruitmentCatalogOverlays(input.sidecars?.unownedOverlay ?? {})
    ),
  }
  const catalogOverlays = splitIndependentRecruitmentCatalogOverlays(sourceOverlay)
  const persistOverlay = orderOverlayKeys(
    sanitizeRecruitAnnouncementOverlay(sourceOverlay, input.baseline),
    input.sidecars?.overlayKeyOrder
  )

  return {
    programDraft,
    persistOverlay,
    catalogOverlays,
  }
}

export function buildIndependentRecruitmentPersistData(
  input: IndependentRecruitmentBuildInput
): IndependentRecruitmentBuildResult {
  return buildIndependentRecruitmentDraft(input)
}

export type { IndependentRecruitmentBuildInput, IndependentRecruitmentBuildResult }
