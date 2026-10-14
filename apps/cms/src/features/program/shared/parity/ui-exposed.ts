import type { Program } from '@/types/domain'
import { applyEconomyRegistrationOverlayToProgram } from '@/features/program/general/lib/economy-registration-overlay-to-program'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import {
  resolveGeneralRecruitDetailDisplayProgram,
  resolveGeneralRecruitDisplayProgram,
  type GeneralRecruitDetailAudience,
} from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { resolveGeneralProgramForRecruitmentEdit } from '@/features/program/general/lib/general-program-recruitment-edit-seed'
import { programToGeneralCommonInfoEditValues } from '@/features/program/general/model/common-info-edit-schema'
import { programToRecruitmentTabEditValues } from '@/features/program/general/lib/general-program-recruitment-edit-seed'
import type { ParityScreenEntry } from './inventory-screens'
import { flattenForParity } from './flatten'
import {
  buildOperationalOverlayLookupAfterSeed,
  flattenPersistedRegistrationOverlaySlice,
} from './registration-overlay-parity'
import type { ApiTruthSnapshot } from './api-truth'
import {
  resetAllOperationalOverlayStoresForParity,
  seedOperationalStoresFromProgramForParity,
} from './store-reset'

function resolveProgramForScreen(screen: ParityScreenEntry, program: Program): Program {
  if (screen.screenId.startsWith('company_school.info')) {
    return applyEconomyRegistrationOverlayToProgram(program, program.registrationOverlay ?? {})
  }
  return program
}

export type UiExposedMode = 'strict' | 'live'

function recruitAudienceFromScreenId(screenId: string): GeneralRecruitDetailAudience | null {
  if (screenId.endsWith('.participant')) return 'participant'
  if (screenId.endsWith('.instructor')) return 'instructor'
  if (screenId.endsWith('.volunteer')) return 'volunteer'
  return null
}

export function buildUiExposedSnapshot(
  screen: ParityScreenEntry,
  program: Program,
  mode: UiExposedMode
): ApiTruthSnapshot {
  if (mode === 'strict') {
    resetAllOperationalOverlayStoresForParity()
  } else {
    seedOperationalStoresFromProgramForParity(program)
  }

  const scoped = resolveProgramForScreen(screen, program)

  if (screen.screenId === 'general.info.common' || screen.screenId.startsWith('company_school.info')) {
    const common = resolveGeneralProgramCommonInfo(scoped)
    const editValues = programToGeneralCommonInfoEditValues({ ...scoped, generalCommonInfo: common })
    return { screenId: screen.screenId, flat: flattenForParity({ common, editValues }) }
  }

  if (screen.screenId.startsWith('general.info.recruitment.')) {
    const audience = recruitAudienceFromScreenId(screen.screenId)
    if (!audience) {
      return { screenId: screen.screenId, flat: {} }
    }
    const merged =
      mode === 'strict'
        ? resolveGeneralProgramForRecruitmentEdit(program)
        : resolveGeneralRecruitDisplayProgram(program, { preferOverlay: true })
    const detail = resolveGeneralRecruitDetailDisplayProgram(merged, audience)
    const editValues = programToRecruitmentTabEditValues(
      mode === 'strict' ? merged : resolveGeneralProgramForRecruitmentEdit(program),
      audience
    )
    return {
      screenId: screen.screenId,
      flat: flattenForParity({
        description: detail.description,
        recruitmentGuide: detail.recruitmentGuide,
        applicationMethod: detail.applicationMethod,
        editDescription: editValues.description,
        editRecruitmentGuide: editValues.recruitmentGuide,
      }),
    }
  }

  if (screen.screenId === 'registration.general.seed_to_detail') {
    if (mode === 'strict') {
      resetAllOperationalOverlayStoresForParity()
      seedOperationalStoresFromProgramForParity(program)
    } else {
      seedOperationalStoresFromProgramForParity(program)
    }
    const storeOverlay = buildOperationalOverlayLookupAfterSeed(program)
    return {
      screenId: screen.screenId,
      flat: flattenPersistedRegistrationOverlaySlice(program, storeOverlay),
    }
  }

  return { screenId: screen.screenId, flat: flattenForParity({ programId: program.id }) }
}
