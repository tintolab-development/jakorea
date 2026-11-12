/**
 * 원문 + 진입 시 자동 조회 기록(AUTO_RAW_ACCESS) 화면의 조회 캐시 — Class G(재사용 금지).
 *
 * 서버는 GET 1회마다 고정 사유로 개인정보 조회 이력을 남긴다(학생 명단·출석 관리, 담당자 정보).
 * 캐시를 재사용하면 다시 들어와도 GET이 나가지 않아 원문은 보이는데 기록이 빠진다.
 * - staleTime 0: 화면에 들어올 때마다(새 observer mount) 다시 조회한다.
 * - gcTime 0: 화면을 떠나 observer가 없어지면 원문 응답을 캐시에서 바로 지운다.
 * 포커스 재조회는 전역 기본값(false)을 따른다.
 */
export const AUTO_RAW_ACCESS_QUERY_OPTIONS = {
  staleTime: 0,
  gcTime: 0,
} as const
