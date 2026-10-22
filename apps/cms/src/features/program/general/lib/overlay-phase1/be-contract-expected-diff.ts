/**
 * BE 세션 정본 vs Legacy overlay apply. 차이를 숨기지 않는다.
 * known-diff 13건은 변경하지 않는다.
 */
export type BeContractExpectedDiff = {
  id: string
  legacy: string
  independent: string
  be: string
}

export const BE_CONTRACT_EXPECTED_DIFFS: readonly BeContractExpectedDiff[] = [
  {
    id: 'legacy-extras-overlay-map-length',
    legacy: 'extrasFromGeneralProgram 은 overlay 맵 길이와 nested 중 큰 값',
    independent: 'GET extras는 nested 길이. 0 허용',
    be: 'curriculumSessions nested 정본. stale overlay 복원 금지',
  },
  {
    id: 'legacy-apply-expands-from-overlay-maps',
    legacy: 'apply() 는 Math.max(1, extras, overlayCount) 로 세션 행을 만듦',
    independent: 'nested가 있으면 extras/nested sessionNo만 사용. map 최대 키로 확장하지 않음',
    be: 'stale overlay에서 삭제 세션 복원 금지',
  },
  {
    id: 'legacy-apply-densifies-sparse-indexes',
    legacy: '1..maxIndex 루프가 빈 회차를 기본 제목으로 채움',
    independent: 'sessionNo [1,3] 유지. 구멍 2를 만들지 않음',
    be: 'sparse sessionNo 양의 정수 유지',
  },
  {
    id: 'legacy-apply-clears-sibling-nested',
    legacy: 'extras.programType 기준이면 항상 상대 nested를 [] 로 넣음 (구조 변경 여부와 무관)',
    independent:
      'EXPLICIT_STRUCTURE_RESET: 구조가 바뀔 때만 비활성 nested []. 구조가 같으면 상대 nested omit/보존',
    be: 'GET은 활성 구조만 채우고 그 외 []. 저장은 구조 변경 시에만 상대 []',
  },
  {
    id: 'legacy-persist-overlay-empties-opposite-maps',
    legacy: 'resync/seed 가 비활성 유형 overlay 맵을 {} 로 비움',
    independent: 'nested가 있는 유형의 overlay 미러만 기록. 반대 nested가 있으면 같이 미러',
    be: 'overlay는 nested 미러. UPDATE에 stale overlay 동봉 불필요',
  },
  {
    id: 'product-detail-mapper-clears-sibling',
    legacy: 'generalCommonInfoEditValuesToProgramPatch 가 현재 구조 기준 비활성 nested를 항상 [] 로 넣음',
    independent:
      '구조 변경 시에만 mapper [] 를 채택. 미변경 저장은 existing 을 보존하고 PATCH 에서 omit',
    be: 'NESTED_SSOT + EXPLICIT_STRUCTURE_RESET + EXPLICIT_DELETE_ONLY',
  },
]
