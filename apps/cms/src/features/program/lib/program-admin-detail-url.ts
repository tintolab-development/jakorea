/**
 * 관리자 프로그램 상세: 목록 URL + programId 쿼리(풀페이지 모달). 단독 /programs/:id 미사용.
 */
export function getProgramAdminDetailUrlFromPathname(programId: string, pathname: string): string {
  const base = pathname.startsWith('/programs/economy-education')
    ? '/programs/economy-education'
    : '/programs/education'
  return `${base}?programId=${encodeURIComponent(programId)}`
}

export function getProgramAdminDetailUrlDefault(programId: string): string {
  return `/programs/education?programId=${encodeURIComponent(programId)}`
}
