import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'

/**
 * 기관명(소재지) 표기.
 * 경기(남부)는 시 단위만 허용 — mock/API 단계에서 location을 시로 맞춘다.
 */
export function formatRegionAssignmentInstitutionLabel(
  institutionName: string,
  location: string,
  _regionKey: UjatInstitutionApplicationRegionKey
): string {
  return `${institutionName}(${location})`
}
