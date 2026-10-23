/**
 * 교육받은 교사 신청 양식 CMS 설정 typed state.
 * Portal 제출 answers 와 별개. persist 는 editorState.
 */
import { peekGeneralApplicationOverlayRecord } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { peekTrainedTeachersRegistrationRhf } from './registration-rhf-api'
import {
  collectTrainedTeachersApplicationState,
  emptyTrainedTeachersApplicationFormState,
  importLegacyTrainedTeachersApplicationOverlay,
} from './registration-rhf-application'
import {
  TRAINED_TEACHERS_APPLICATION_EDITOR_KIND,
  type TrainedTeachersApplicationFormState,
} from './registration-canonical-types'

export { emptyTrainedTeachersApplicationFormState }

export function collectTrainedTeachersApplicationFormState(
  overlay?: Record<string, unknown>
): TrainedTeachersApplicationFormState {
  if (overlay != null) {
    return importLegacyTrainedTeachersApplicationOverlay(overlay)
  }
  const rhf = peekTrainedTeachersRegistrationRhf()
  if (rhf != null) {
    return collectTrainedTeachersApplicationState(rhf.getValues().application)
  }
  return importLegacyTrainedTeachersApplicationOverlay(
    peekGeneralApplicationOverlayRecord('application-trained-teachers')
  )
}

export function trainedTeachersApplicationEditorState(
  state: TrainedTeachersApplicationFormState
): Record<string, unknown> {
  return {
    kind: TRAINED_TEACHERS_APPLICATION_EDITOR_KIND,
    schemaVersion: 1,
    application: state,
  }
}

export function readTrainedTeachersApplicationEditorState(
  editorState: Record<string, unknown> | undefined
): TrainedTeachersApplicationFormState | null {
  if (editorState?.kind !== TRAINED_TEACHERS_APPLICATION_EDITOR_KIND) return null
  const application = editorState.application
  if (!application || typeof application !== 'object' || Array.isArray(application)) return null
  const rec = application as Partial<TrainedTeachersApplicationFormState>
  return {
    ...emptyTrainedTeachersApplicationFormState(),
    ...rec,
    basicInfo: {
      ...emptyTrainedTeachersApplicationFormState().basicInfo,
      ...(rec.basicInfo ?? {}),
    },
    preferredSchedules: rec.preferredSchedules ?? [],
  }
}
