/**
 * 일반 신규 등록 신청 — RHF kv → Independent Form Version overlay.
 * 프로그램 CREATE persist 에 application.* 를 넣지 않는다.
 */
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import {
  buildIndependentApplicationDraft,
  splitIndependentApplicationOverlays,
} from './build-independent-application'
import { overlayKvToIndependentApplicationInput } from './overlay-kv-to-application-form-values'
import type { ApplicationCatalog, IndependentApplicationBuildResult } from './application-form-values'
import { APPLICATION_BINDING_CATALOG_IDS } from './program-edit-snapshot.types'
import {
  selectApplicationKvForParticipant,
  participantFromWizardUi,
} from './registration-wizard-application-rhf'
import type { RegistrationWizardUiValues } from './registration-wizard-ui-values'

const CATALOG_BY_PARTICIPANT: Array<{
  catalog: ApplicationCatalog
  selected: (participant: ProgramRegistrationParticipantSelection) => boolean
}> = [
  { catalog: 'application-participant-school', selected: p => p.organization },
  { catalog: 'application-participant-individual', selected: p => p.individual },
  { catalog: 'application-instructor', selected: p => p.teacherInstructor },
  { catalog: 'application-volunteer', selected: p => p.volunteer },
]

function catalogsForParticipant(
  participant: ProgramRegistrationParticipantSelection
): ApplicationCatalog[] {
  return CATALOG_BY_PARTICIPANT.filter(entry => entry.selected(participant)).map(entry => entry.catalog)
}

export function buildWizardApplicationIndependentDrafts(
  uiValues: RegistrationWizardUiValues
): IndependentApplicationBuildResult[] {
  const participant = participantFromWizardUi(uiValues)
  const selectedKv = selectApplicationKvForParticipant(uiValues.applicationKv, participant)
  const adapted = overlayKvToIndependentApplicationInput(selectedKv)
  const catalogs = catalogsForParticipant(participant)
  return catalogs.map(catalog =>
    buildIndependentApplicationDraft({
      catalog,
      formValues: adapted.formValues,
      sidecars: {
        ...adapted.sidecars,
        unownedOverlay: {},
        previousLocalOverlay: {},
      },
    })
  )
}

export function collectWizardApplicationOverlayForCatalog(
  catalogTemplateId: string,
  uiValues?: RegistrationWizardUiValues | null
): Record<string, unknown> | null {
  if (uiValues == null) return null
  const participant = participantFromWizardUi(uiValues)
  const selectedKv = selectApplicationKvForParticipant(uiValues.applicationKv, participant)
  const split = splitIndependentApplicationOverlays(selectedKv)
  for (const catalog of APPLICATION_BINDING_CATALOG_IDS) {
    if (catalogTemplateId === catalog || catalogTemplateId.startsWith(`${catalog}-`)) {
      if (!catalogsForParticipant(participant).includes(catalog)) return {}
      const adapted = overlayKvToIndependentApplicationInput(split[catalog] ?? {})
      return buildIndependentApplicationDraft({
        catalog,
        formValues: adapted.formValues,
        sidecars: { ...adapted.sidecars, unownedOverlay: {}, previousLocalOverlay: {} },
      }).overlay
    }
  }
  return null
}
