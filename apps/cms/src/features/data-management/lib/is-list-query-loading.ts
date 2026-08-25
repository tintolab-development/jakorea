/** 목록 GET이 끝나기 전(성공·실패 전)이면 true. 빈 배열 성공은 false. */
export function isDataManagementListLoading(query: {
  data: unknown
  isError: boolean
}): boolean {
  return query.data === undefined && !query.isError
}
