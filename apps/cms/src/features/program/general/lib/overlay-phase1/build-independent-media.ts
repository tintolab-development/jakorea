/**
 * Phase 1-B 일반 프로그램 미디어 Independent Snapshot Builder.
 * overlay store / 실제 미디어 PUT / RHF 를 호출하지 않는다.
 */
import {
  independentMediaBindCalls,
  independentMediaStateFromFormValues,
  persistIndependentMediaOverlay,
} from './media-domain'
import type {
  IndependentMediaBuildInput,
  IndependentMediaBuildResult,
} from './media-form-values'

export function buildIndependentMediaSidecar(
  input: IndependentMediaBuildInput
): IndependentMediaBuildResult {
  const state = independentMediaStateFromFormValues(input.formValues)
  const bindCalls = independentMediaBindCalls(input.formValues, input.sidecars?.created)
  return {
    sidecar: { state, bindCalls },
    persistOverlay: persistIndependentMediaOverlay(
      input.sidecars?.unownedOverlay,
      input.sidecars?.overlayKeyOrder
    ),
    state,
    bindCalls,
  }
}

export function buildIndependentMediaPersistData(
  input: IndependentMediaBuildInput
): IndependentMediaBuildResult {
  return buildIndependentMediaSidecar(input)
}

export type { IndependentMediaBuildInput, IndependentMediaBuildResult }
