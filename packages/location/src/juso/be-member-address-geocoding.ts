/**
 * BE DistanceProvider(Naver Maps) — 회원 자택 주소와 education-scope `distanceKm` QA·FE 저장 규칙.
 * OpenAPI 필드명: Platform/CMS `address`(도로명) + `addressDetail`(상세), 우편번호는 별도 필드.
 */

/** FE·QA 슬랙/체크리스트용 한 줄 (커밋용 handoff md 아님) */
export const BE_MEMBER_ADDRESS_GEOCODING_QA_ONE_LINER =
  'Geocoding query는 roadAddr + 공백 + addressDetail (우편번호 제외). ' +
  'distanceKm는 도로명만으로도 될 때가 많지만, 본번 오류·장소명만·상세만 저장 같은 경우는 road만으로도 실패 → BE는 null, UI는 -만 표시 (클라이언트 재계산 금지). ' +
  'Juso 선택 시 address에 roadAddr만 넣고, 동·호·층은 addressDetail에 두면 BE 후보 순서와 가장 잘 맞습니다.'

/**
 * BE가 지오코딩에 쓰는 query 문자열 형태 (거리 계산용 — FE에서 km를 만들지 말 것).
 * QA·로그 대조용만 사용.
 */
export function formatMemberAddressForBeGeocodingQuery(
  roadAddr: string,
  addressDetail: string,
): string {
  return [roadAddr.trim(), addressDetail.trim()].filter(Boolean).join(' ')
}

/** Juso 선택 결과 → 회원 `address` 필드 (도로명 우선, 지번은 road 없을 때만) */
export function pickJusoRoadAddressLine(roadAddr: string, jibunAddr: string): string {
  const road = roadAddr.trim()
  if (road) return road
  return jibunAddr.trim()
}
