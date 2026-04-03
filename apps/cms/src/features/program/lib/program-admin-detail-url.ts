/**
 * 관리자 프로그램 상세: 목록 URL + programId 쿼리(풀페이지 모달). 단독 /programs/:id 미사용.
 */

import { getEconomyPrograms, getEducationPrograms } from '@/data/mock'

export function getProgramListBasePathForProgramId(
  programId: string
): '/programs/economy-education' | '/programs/education' {
  if (getEconomyPrograms().some(p => p.id === programId)) {
    return '/programs/economy-education'
  }
  if (getEducationPrograms().some(p => p.id === programId)) {
    return '/programs/education'
  }
  return '/programs/education'
}

/** 공통 정보 탭(info)으로 바로 열기 — 예: /programs/economy-education?lnb=info&tab=info&programId=… */
export function getProgramAdminDetailInfoTabUrl(programId: string): string {
  const base = getProgramListBasePathForProgramId(programId)
  const params = new URLSearchParams({
    lnb: 'info',
    tab: 'info',
    programId,
  })
  return `${base}?${params.toString()}`
}

export function getProgramAdminDetailUrlFromPathname(programId: string, pathname: string): string {
  const base = pathname.startsWith('/programs/economy-education')
    ? '/programs/economy-education'
    : '/programs/education'
  return `${base}?programId=${encodeURIComponent(programId)}`
}

export function getProgramAdminDetailUrlDefault(programId: string): string {
  return `/programs/education?programId=${encodeURIComponent(programId)}`
}
