/**
 * Phase 1-B 신청 Independent Snapshot Builder.
 * overlay store / collect / peek / RHF 를 호출하지 않는다.
 */
import {
  applicationCatalogPrefixes,
  independentApplicationFormBindingIntent,
  mergeIndependentApplicationLocalOverlay,
  orderIndependentApplicationOverlay,
  pickApplicationOverlayByCatalog,
  serializeIndependentApplicationFormValues,
  splitIndependentApplicationCatalogOverlays,
} from './application-domain'
import type {
  ApplicationCatalog,
  IndependentApplicationBuildInput,
  IndependentApplicationBuildResult,
  IndependentApplicationDraftsInput,
} from './application-form-values'
import { APPLICATION_BINDING_CATALOG_IDS } from './program-edit-snapshot.types'

export function buildIndependentApplicationDraft(
  input: IndependentApplicationBuildInput
): IndependentApplicationBuildResult {
  const serialized = serializeIndependentApplicationFormValues(input.formValues)
  const catalogOverlay = pickApplicationOverlayByCatalog(serialized, input.catalog)
  const overlay = orderIndependentApplicationOverlay(
    catalogOverlay,
    input.sidecars?.overlayKeyOrder
  )
  const localOverlay = mergeIndependentApplicationLocalOverlay(
    input.sidecars?.previousLocalOverlay,
    overlay
  )

  return {
    catalogId: input.catalog,
    prefixes: applicationCatalogPrefixes(input.catalog),
    overlay,
    sink: 'form-version-overlay',
    formBindingIntent: independentApplicationFormBindingIntent(input.catalog),
    bridge: input.sidecars?.bridge,
    localOverlay,
  }
}

export function buildIndependentApplicationPersistData(
  input: IndependentApplicationBuildInput
): IndependentApplicationBuildResult {
  return buildIndependentApplicationDraft(input)
}

export function buildIndependentApplicationDrafts(
  input: IndependentApplicationDraftsInput
): IndependentApplicationBuildResult[] {
  const catalogs = input.catalogs ?? APPLICATION_BINDING_CATALOG_IDS
  return catalogs.map(catalog =>
    buildIndependentApplicationDraft({
      catalog,
      formValues: input.formValues,
      sidecars: input.sidecars,
    })
  )
}

export function buildIndependentApplicationFormVersionPutOverlay(
  overlay: Record<string, unknown>
): { overlay: Record<string, unknown> } {
  return { overlay }
}

export function splitIndependentApplicationOverlays(
  overlay: Record<string, unknown>
): Record<ApplicationCatalog, Record<string, unknown>> {
  return splitIndependentApplicationCatalogOverlays(overlay)
}

export type { IndependentApplicationBuildInput, IndependentApplicationBuildResult }
