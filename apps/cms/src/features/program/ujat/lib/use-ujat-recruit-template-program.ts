import { useMemo, useSyncExternalStore } from 'react'
import type { Program } from '@/types/domain'
import { resolveUjatRecruitDisplayProgram } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import {
  applyUjatRecruitInstitutionOverlayOntoProgram,
  pickUjatRecruitInstitutionOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-institution-template-merge'
import {
  applyUjatRecruitVolunteerOverlayOntoProgram,
  pickUjatRecruitVolunteerOverlay,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-template-merge'
import {
  getUjatProgramRegistrationOverlayRecord,
  getUjatProgramRegistrationOverlayVersion,
  subscribeUjatProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import {
  getUjatRecruitInstitutionOverlayRecord,
  getUjatRecruitInstitutionOverlayVersion,
  subscribeUjatRecruitInstitutionOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-institution/ujat-recruit-institution-overlay-sync'
import {
  getUjatRecruitVolunteerOverlayRecord,
  getUjatRecruitVolunteerOverlayVersion,
  subscribeUjatRecruitVolunteerOverlay,
} from '@/features/template/ui/form-set/recruit-form/UJAT-volunteer/ujat-recruit-volunteer-overlay-sync'

export function useUjatRecruitTemplateProgram(
  preview: Program,
  kind: 'institution' | 'volunteer'
): Program {
  const programVersion = useSyncExternalStore(
    subscribeUjatProgramRegistrationOverlay,
    getUjatProgramRegistrationOverlayVersion,
    getUjatProgramRegistrationOverlayVersion
  )
  const institutionVersion = useSyncExternalStore(
    subscribeUjatRecruitInstitutionOverlay,
    getUjatRecruitInstitutionOverlayVersion,
    getUjatRecruitInstitutionOverlayVersion
  )
  const volunteerVersion = useSyncExternalStore(
    subscribeUjatRecruitVolunteerOverlay,
    getUjatRecruitVolunteerOverlayVersion,
    getUjatRecruitVolunteerOverlayVersion
  )

  return useMemo(() => {
    const programOverlay = getUjatProgramRegistrationOverlayRecord()
    const institutionOverlay = {
      ...pickUjatRecruitInstitutionOverlay(programOverlay),
      ...getUjatRecruitInstitutionOverlayRecord(),
    }
    const volunteerOverlay = {
      ...pickUjatRecruitVolunteerOverlay(programOverlay),
      ...getUjatRecruitVolunteerOverlayRecord(),
    }
    let next = resolveUjatRecruitDisplayProgram(preview)
    next = applyUjatRecruitInstitutionOverlayOntoProgram(next, institutionOverlay)
    if (kind === 'volunteer') {
      next = applyUjatRecruitVolunteerOverlayOntoProgram(next, volunteerOverlay)
    }
    return next
  }, [kind, preview, programVersion, institutionVersion, volunteerVersion])
}
