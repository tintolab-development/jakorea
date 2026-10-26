/** 회원 전용 application-options 조회의 실행 조건. */
export function shouldFetchPortalApplicationOptions(
  numericProgramId: number | null,
  remote: boolean,
  hasToken: boolean,
): boolean {
  return remote && numericProgramId != null && hasToken
}
