/**
 * 교육받은 교사 모집 양식 typed state.
 * persist 는 editorState. 내부 apply 만 기존 Program merge 함수를 재사용한다.
 */
import type { Program } from '@/types/domain'
import { applyGeneralRecruitOverlayToProgram } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-additional-content-flush'
import { peekTrainedTeachersRegistrationRhf } from './registration-rhf-api'
import {
  collectTrainedTeachersRecruitmentState,
  emptyTrainedTeachersRecruitFormState,
  importLegacyTrainedTeachersRecruitmentOverlay,
  serializeTrainedTeachersRecruitmentForFormVersion,
} from './registration-rhf-recruitment'
import {
  TRAINED_TEACHERS_RECRUIT_EDITOR_KIND,
  type TrainedTeachersRecruitFormState,
} from './registration-canonical-types'

export { emptyTrainedTeachersRecruitFormState }

/**
 * Part3 5단계: TT RHF 미마운트 fallback 의 스토어 읽기(기관 모집 + 일반 모집)는 호출부가 넘긴다(DI).
 * 이 모듈은 overlay 스토어를 import 하지 않는다. fallback 을 안 넘기면 빈 레코드로 읽는다.
 */
export function collectTrainedTeachersRecruitFormState(
  overlay?: Record<string, unknown>,
  readStoreFallback?: () => Record<string, unknown>
): TrainedTeachersRecruitFormState {
  if (overlay != null) {
    return importLegacyTrainedTeachersRecruitmentOverlay(overlay)
  }
  const rhf = peekTrainedTeachersRegistrationRhf()
  if (rhf != null) {
    flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
    return collectTrainedTeachersRecruitmentState(rhf.getValues().recruitment)
  }
  flushRecruitDetailAdditionalContentIntoGeneralRecruitOverlay()
  return importLegacyTrainedTeachersRecruitmentOverlay(readStoreFallback?.() ?? {})
}

/** persist/bind 용 키 레코드. 입력 정본이 아니라 Form Version 출력이다. */
export function trainedTeachersRecruitStateToApplyRecord(
  state: TrainedTeachersRecruitFormState
): Record<string, unknown> {
  return serializeTrainedTeachersRecruitmentForFormVersion(state)
}

export function applyTrainedTeachersRecruitToProgram(
  program: Program,
  state: TrainedTeachersRecruitFormState
): Program {
  return applyGeneralRecruitOverlayToProgram(
    program,
    trainedTeachersRecruitStateToApplyRecord(state),
    { preferOverlay: true }
  )
}

export function trainedTeachersRecruitEditorState(
  state: TrainedTeachersRecruitFormState
): Record<string, unknown> {
  return {
    kind: TRAINED_TEACHERS_RECRUIT_EDITOR_KIND,
    schemaVersion: 1,
    recruit: state,
  }
}

export function readTrainedTeachersRecruitEditorState(
  editorState: Record<string, unknown> | undefined
): TrainedTeachersRecruitFormState | null {
  if (editorState?.kind !== TRAINED_TEACHERS_RECRUIT_EDITOR_KIND) return null
  const recruit = editorState.recruit
  if (!recruit || typeof recruit !== 'object' || Array.isArray(recruit)) return null
  return { ...emptyTrainedTeachersRecruitFormState(), ...(recruit as TrainedTeachersRecruitFormState) }
}
