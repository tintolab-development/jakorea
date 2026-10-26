/** UJAT 봉사 신청 overlay 키(값·스토어 아님)와 순수 도우미. 스토어는 `ujat-application-volunteer-overlay-sync`. */
export const UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS = {
  preferredRegion: 'ujatVolunteerApplication.preferredRegion',
  universityName: 'ujatVolunteerApplication.universityName',
  grade: 'ujatVolunteerApplication.grade',
  major: 'ujatVolunteerApplication.major',
  applicationRoute: 'ujatVolunteerApplication.applicationRoute',
  applicationRouteOther: 'ujatVolunteerApplication.applicationRouteOther',
  id1365: 'ujatVolunteerApplication.id1365',
  previousTerm: 'ujatVolunteerApplication.previousTerm',
  previousYear: 'ujatVolunteerApplication.previousYear',
  previousTermFileNames: 'ujatVolunteerApplication.previousTermFileNames',
  hasExperience: 'ujatVolunteerApplication.hasExperience',
} as const

/** 수료증 파일 등 지원자 런타임 응답 — 프로그램 생성용 overlay에서 뺀다. */
export function stripUjatApplicationVolunteerProgramOnlyFields(
  record: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...record }
  delete next[UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames]
  return next
}
