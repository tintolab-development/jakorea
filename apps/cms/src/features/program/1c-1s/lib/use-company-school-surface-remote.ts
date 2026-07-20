import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  shouldUseCompanySchoolApplicationsRemoteApi,
  shouldUseCompanySchoolProgramProgressRemoteApi,
  shouldUseCompanySchoolProgramsReadsRemoteApi,
  shouldUseCompanySchoolRemoteApi,
} from '@/features/program/1c-1s/api/capabilities'
import { isCompanySchoolProgramsPath } from '@/features/program/1c-1s/lib/is-company-school-route'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { shouldUseGeneralProgramsRemoteApi } from '@/features/program/general/api/general-programs-remote-capabilities'
import { shouldUseTrainedTeacherProgramsRemoteApi } from '@/features/program/trained-teachers/api/capabilities'
import { isTrainedTeachersProgramsPath } from '@/features/program/trained-teachers/lib/is-trained-teachers-route'

/** 현재 URL이 1사1교 목록/상세 표면인지 */
export function useIsCompanySchoolProgramsSurface(): boolean {
  const { pathname } = useLocation()
  return useMemo(() => isCompanySchoolProgramsPath(pathname), [pathname])
}

/** 현재 URL이 교육받은 교사 목록/상세 표면인지 */
export function useIsTrainedTeachersProgramsSurface(): boolean {
  const { pathname } = useLocation()
  return useMemo(() => isTrainedTeachersProgramsPath(pathname), [pathname])
}

/**
 * 표면별 신청 remote 활성.
 * 교육받은 교사는 전용 organization-applications sync를 쓰므로 여기서는 false
 * (일반 applications list URL로 오인 호출 방지).
 */
export function useApplicationsRemoteEnabledForSurface(programId: string | undefined): boolean {
  const isCompanySchool = useIsCompanySchoolProgramsSurface()
  const isTrainedTeachers = useIsTrainedTeachersProgramsSurface()
  return useMemo(() => {
    if (!programId) return false
    if (isTrainedTeachers) return false
    return isCompanySchool
      ? shouldUseCompanySchoolApplicationsRemoteApi()
      : shouldUseGeneralApplicationsRemoteApi()
  }, [isCompanySchool, isTrainedTeachers, programId])
}

/** 표면별 진행현황 remote 활성 — TT는 전용 participating institutions sync 사용 */
export function useProgramProgressRemoteEnabledForSurface(
  programId: string | undefined
): boolean {
  const isCompanySchool = useIsCompanySchoolProgramsSurface()
  const isTrainedTeachers = useIsTrainedTeachersProgramsSurface()
  return useMemo(() => {
    if (!programId) return false
    // 일반 participants API로 오인 호출 방지 — TT는 use-progress-school-list에서 전용 훅 사용
    if (isTrainedTeachers) return false
    return isCompanySchool
      ? shouldUseCompanySchoolProgramProgressRemoteApi()
      : shouldUseGeneralProgramProgressRemoteApi()
  }, [isCompanySchool, isTrainedTeachers, programId])
}

/** 표면별 programs 읽기(posts/surveys/navigation) remote 활성 */
export function useProgramsReadsRemoteEnabledForSurface(programId: string | undefined): boolean {
  const isCompanySchool = useIsCompanySchoolProgramsSurface()
  const isTrainedTeachers = useIsTrainedTeachersProgramsSurface()
  return useMemo(() => {
    if (!programId) return false
    if (isTrainedTeachers) return shouldUseTrainedTeacherProgramsRemoteApi()
    return isCompanySchool
      ? shouldUseCompanySchoolProgramsReadsRemoteApi()
      : shouldUseGeneralProgramsRemoteApi()
  }, [isCompanySchool, isTrainedTeachers, programId])
}

/** 표면별 프로그램 CRUD remote (lifecycle 등) */
export function useProgramsCrudRemoteEnabledForSurface(): boolean {
  const isCompanySchool = useIsCompanySchoolProgramsSurface()
  const isTrainedTeachers = useIsTrainedTeachersProgramsSurface()
  if (isTrainedTeachers) return shouldUseTrainedTeacherProgramsRemoteApi()
  return isCompanySchool
    ? shouldUseCompanySchoolRemoteApi()
    : shouldUseGeneralProgramsRemoteApi()
}
