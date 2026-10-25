/** 상세 공통정보 KPI는 Typed RHF가 정본이다. Overlay projection은 쓰지 않는다. */
export type UjatDetailEditFormKpiValues = {
  kpiFinalParticipants?: number
  kpiVolunteerCount?: number
  kpiFinalSchools?: number
  kpiFinalClasses?: number
}

export function buildUjatKpiOverlayFromDetailEditForm(
  _values: UjatDetailEditFormKpiValues
): Record<string, number | null> {
  return {}
}

export function syncUjatDetailEditFormKpiToOverlay(_values: UjatDetailEditFormKpiValues): void {
  // KPI overlay write 경로 제거. 저장은 Program KPI 컬럼/RHF를 사용한다.
}
