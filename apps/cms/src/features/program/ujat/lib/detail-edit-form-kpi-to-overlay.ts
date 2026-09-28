import { patchUjatProgramRegistrationOverlay } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'

/** 상세 공통정보 RHF KPI → 등록 overlay `ujat.kpi.*` (저장 전 merge용) */
export type UjatDetailEditFormKpiValues = {
  kpiFinalParticipants?: number
  kpiVolunteerCount?: number
  kpiFinalSchools?: number
  kpiFinalClasses?: number
}

export function buildUjatKpiOverlayFromDetailEditForm(
  values: UjatDetailEditFormKpiValues
): Record<string, number | null> {
  return {
    'ujat.kpi.participantCount': values.kpiFinalParticipants ?? null,
    'ujat.kpi.volunteer': values.kpiVolunteerCount ?? null,
    'ujat.kpi.dispatchedSchool': values.kpiFinalSchools ?? null,
    'ujat.kpi.dispatchedClass': values.kpiFinalClasses ?? null,
  }
}

export function syncUjatDetailEditFormKpiToOverlay(values: UjatDetailEditFormKpiValues): void {
  patchUjatProgramRegistrationOverlay(buildUjatKpiOverlayFromDetailEditForm(values))
}
