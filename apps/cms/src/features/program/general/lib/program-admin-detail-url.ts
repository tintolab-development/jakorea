/**
 * 관리자 프로그램 상세: 목록 URL + programId 쿼리(풀페이지 모달). 단독 /programs/:id 미사용.
 *
 * BE remote는 숫자 programId(예: 167001)를 쓰므로, prefix만으로는 유형을 알 수 없다.
 * sync helper는 알려진 mock/prefix만 분기하고, 그 외는 `/programs/general`로 연다
 * (루트 `/programs`는 목록에 없으면 모달이 안 열려 “튕김”처럼 보임).
 * 정확한 유형 경로는 `resolveProgramAdminDetailInfoTabUrl` 사용.
 */

import { buildGeneralProgramDetailUrl } from '@/features/program/general/lib/detail-url'
import { isGeneralProgramId } from '@/features/program/general/lib/detail-meta'
import {
  COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX,
  TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX,
} from '@/features/program/general/lib/registration-local-save'
import { isUjatProgramId } from '@/features/program/ujat/lib/ujat-program-detail-meta'
import { buildUjatProgramDetailUrl } from '@/features/program/ujat/lib/ujat-program-detail-url'

export function isCompanySchoolProgramId(programId: string): boolean {
  return (
    programId.startsWith('economy-prog-') ||
    programId.startsWith('company-school-prog-') ||
    programId.startsWith(COMPANY_SCHOOL_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)
  )
}

export function isTrainedTeachersProgramId(programId: string): boolean {
  return (
    programId.startsWith('trained-teachers-prog-') ||
    programId.startsWith(TRAINED_TEACHERS_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX)
  )
}

function buildCompanySchoolProgramDetailUrl(
  programId: string,
  lnb = 'info',
  tab = 'info'
): string {
  const params = new URLSearchParams({ programId, lnb, tab })
  return `/programs/company-school?${params.toString()}`
}

function buildTrainedTeachersProgramDetailUrl(
  programId: string,
  lnb = 'info',
  tab = 'info'
): string {
  const params = new URLSearchParams({ programId, lnb, tab })
  return `/programs/trained-teachers?${params.toString()}`
}

/** BE `canonicalProgramType` / `rawProgramType` → 관리자 목록+상세 URL */
export function getProgramAdminDetailInfoTabUrlForProgramType(
  programId: string,
  programType: string | null | undefined
): string {
  const t = programType?.trim().toUpperCase() ?? ''
  if (t === 'UJAT' || t === 'UJAT_DGBONG') {
    return buildUjatProgramDetailUrl(programId, 'info', 'info')
  }
  if (
    t === 'COMPANY_SCHOOL' ||
    t === 'ECONOMY' ||
    t === 'ONE_COMPANY_ONE_SCHOOL' ||
    t === '1C1S'
  ) {
    return buildCompanySchoolProgramDetailUrl(programId, 'info', 'info')
  }
  if (t === 'TRAINED_TEACHER' || t === 'TRAINED_TEACHERS') {
    return buildTrainedTeachersProgramDetailUrl(programId, 'info', 'info')
  }
  // GENERAL / GEMINI / 기타 — 일반 목록은 URL programId만으로 풀페이지 모달을 연다
  return buildGeneralProgramDetailUrl(programId, 'info', 'info')
}

/**
 * mock·로컬 등록 prefix로 유형이 확정될 때만 URL 반환.
 * 숫자 BE id 등은 null → remote resolve 필요.
 */
export function tryGetProgramAdminDetailInfoTabUrlByIdPrefix(programId: string): string | null {
  const id = programId.trim()
  if (!id) return null
  if (isUjatProgramId(id)) {
    return buildUjatProgramDetailUrl(id, 'info', 'info')
  }
  if (isGeneralProgramId(id)) {
    return buildGeneralProgramDetailUrl(id, 'info', 'info')
  }
  if (isCompanySchoolProgramId(id)) {
    return buildCompanySchoolProgramDetailUrl(id, 'info', 'info')
  }
  if (isTrainedTeachersProgramId(id)) {
    return buildTrainedTeachersProgramDetailUrl(id, 'info', 'info')
  }
  return null
}

export function getProgramListBasePathForProgramId(programId: string): string {
  const byPrefix = tryGetProgramAdminDetailInfoTabUrlByIdPrefix(programId)
  if (byPrefix) {
    return byPrefix.split('?')[0] ?? '/programs/general'
  }
  return '/programs/general'
}

/** 공통 정보 탭(info)으로 바로 열기 — sync. 미지 id는 general(모달 SSOT). */
export function getProgramAdminDetailInfoTabUrl(programId: string): string {
  return (
    tryGetProgramAdminDetailInfoTabUrlByIdPrefix(programId) ??
    buildGeneralProgramDetailUrl(programId, 'info', 'info')
  )
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
    const params = new URLSearchParams({
      programId,
      lnb: 'info',
      tab: 'info',
    })
    const basePath = p.startsWith('/programs/economy-education')
      ? '/programs/economy-education'
      : '/programs/company-school'
    return `${basePath}?${params.toString()}`
  }
  if (pathname.startsWith('/programs/trained-teachers')) {
    const params = new URLSearchParams({
      programId,
      lnb: 'info',
      tab: 'info',
    })
    return `/programs/trained-teachers?${params.toString()}`
  }
  if (pathname.startsWith('/programs/education') || pathname.startsWith('/programs/general')) {
    return buildGeneralProgramDetailUrl(programId, 'info', 'info')
  }
  return getProgramAdminDetailInfoTabUrl(programId)
}

export function getProgramAdminDetailUrlDefault(programId: string): string {
  return getProgramAdminDetailInfoTabUrl(programId)
}
