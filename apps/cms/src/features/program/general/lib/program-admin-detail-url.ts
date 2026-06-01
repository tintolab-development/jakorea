/**
 * 관리자 프로그램 상세: 목록 URL + programId 쿼리(풀페이지 모달). 단독 /programs/:id 미사용.
 */

import { buildGeneralProgramDetailUrl } from '@/features/program/general/lib/detail-url'
import { isGeneralProgramId } from '@/features/program/general/lib/detail-meta'
import { isUjatProgramId } from '@/features/program/ujat/lib/ujat-program-detail-meta'
import { buildUjatProgramDetailUrl } from '@/features/program/ujat/lib/ujat-program-detail-url'

export function getProgramListBasePathForProgramId(_programId: string): '/programs' {
  return '/programs'
}

/** 공통 정보 탭(info)으로 바로 열기 — 예: /programs?lnb=info&tab=info&programId=… */
export function getProgramAdminDetailInfoTabUrl(programId: string): string {
  if (isUjatProgramId(programId)) {
    return buildUjatProgramDetailUrl(programId, 'info', 'info')
  }
  if (isGeneralProgramId(programId)) {
    return buildGeneralProgramDetailUrl(programId, 'info', 'info')
  }
  const params = new URLSearchParams({
    lnb: 'info',
    tab: 'info',
    programId,
  })
  return `/programs?${params.toString()}`
}

export function getProgramAdminDetailUrlFromPathname(programId: string, pathname: string): string {
  const p = pathname.replace(/\/$/, '') || '/'
  if (p === '/programs/ujat' || p.startsWith('/programs/ujat/')) {
    return buildUjatProgramDetailUrl(programId, 'info', 'info')
  }
  if (
    pathname.startsWith('/programs/economy-education') ||
    pathname.startsWith('/programs/company-school')
  ) {
    return `/programs?programId=${encodeURIComponent(programId)}`
  }
  if (pathname.startsWith('/programs/education') || pathname.startsWith('/programs/general')) {
    return buildGeneralProgramDetailUrl(programId, 'info', 'info')
  }
  return `/programs?programId=${encodeURIComponent(programId)}`
}

export function getProgramAdminDetailUrlDefault(programId: string): string {
  if (isUjatProgramId(programId)) {
    return buildUjatProgramDetailUrl(programId, 'info', 'info')
  }
  if (isGeneralProgramId(programId)) {
    return buildGeneralProgramDetailUrl(programId, 'info', 'info')
  }
  return `/programs?programId=${encodeURIComponent(programId)}`
}
