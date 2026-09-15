import type { SetURLSearchParams } from 'react-router-dom'
import {
  parseGeneralDetailLnb,
  type GeneralDetailLnbKey,
} from '@/features/program/general/lib/detail-url'

export const GENERAL_PROGRAM_DETAIL_TAB_PARAM = 'tab'
export const GENERAL_PROGRAM_DETAIL_LNB_PARAM = 'lnb'
export const GENERAL_PROGRAM_DETAIL_EDIT_PARAM = 'edit'
export const GENERAL_PROGRAM_DETAIL_SUB_TAB_PARAM = 'subTab'
export const GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM =
  'participantRecruitmentPreview'
export const GENERAL_PROGRAM_INSTRUCTOR_RECRUITMENT_PREVIEW_PARAM =
  'instructorRecruitmentPreview'
export const GENERAL_PROGRAM_VOLUNTEER_RECRUITMENT_PREVIEW_PARAM =
  'volunteerRecruitmentPreview'
export const GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_ACTIVE = '1'
/** @deprecated alias — ACTIVE 값은 세 탭 공통 */
export const GENERAL_PROGRAM_RECRUITMENT_PREVIEW_ACTIVE =
  GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_ACTIVE

export const GENERAL_PROGRAM_RECRUITMENT_PREVIEW_PARAMS = [
  GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM,
  GENERAL_PROGRAM_INSTRUCTOR_RECRUITMENT_PREVIEW_PARAM,
  GENERAL_PROGRAM_VOLUNTEER_RECRUITMENT_PREVIEW_PARAM,
] as const

export const GENERAL_PROGRAM_DETAIL_NESTED_QUERY_PARAMS = [
  'schoolId',
  'schoolTab',
  'instructorId',
  'instructorTab',
  'volunteerId',
  'volunteerTab',
  'participantId',
  'participantTab',
  'participantView',
  'progressCalendarRange',
  'schoolName',
  'institutionSido',
  'institutionSigungu',
  'educationGrade',
  'textbookStatus',
  'teacherName',
  'participantName',
  'homeSido',
  'homeSigungu',
  'applicantId',
  'detailTab',
] as const

/** breadcrumb·닫기 시 sweep — 목록 필터(`status`, `title`, `viewMode` 등)는 delete 대상 아님 */
export const GENERAL_PROGRAM_DETAIL_QUERY_PARAMS = [
  'programId',
  GENERAL_PROGRAM_DETAIL_LNB_PARAM,
  GENERAL_PROGRAM_DETAIL_TAB_PARAM,
  GENERAL_PROGRAM_DETAIL_EDIT_PARAM,
  GENERAL_PROGRAM_DETAIL_SUB_TAB_PARAM,
  ...GENERAL_PROGRAM_RECRUITMENT_PREVIEW_PARAMS,
  ...GENERAL_PROGRAM_DETAIL_NESTED_QUERY_PARAMS,
] as const

export function readGeneralProgramDetailRoute(searchParams: URLSearchParams): {
  lnb: GeneralDetailLnbKey
  tab: string
} {
  return {
    lnb: parseGeneralDetailLnb(searchParams) ?? 'info',
    tab: searchParams.get(GENERAL_PROGRAM_DETAIL_TAB_PARAM) ?? 'info',
  }
}

export function patchGeneralProgramDetailLnbTab(
  source: URLSearchParams,
  options: {
    programId: string
    lnb: GeneralDetailLnbKey
    tab: string
    clearNested?: boolean
  }
): URLSearchParams {
  const next = new URLSearchParams(source)
  next.set('programId', options.programId)
  next.set(GENERAL_PROGRAM_DETAIL_LNB_PARAM, options.lnb)
  next.set(GENERAL_PROGRAM_DETAIL_TAB_PARAM, options.tab)
  next.delete(GENERAL_PROGRAM_DETAIL_EDIT_PARAM)

  if (options.clearNested !== false) {
    for (const key of GENERAL_PROGRAM_DETAIL_NESTED_QUERY_PARAMS) {
      next.delete(key)
    }
  }

  return next
}

export function applyGeneralProgramDetailLnbTab(
  setSearchParams: SetURLSearchParams,
  options: {
    programId: string
    lnb: GeneralDetailLnbKey
    tab: string
    clearNested?: boolean
  }
): void {
  setSearchParams(
    prev =>
      patchGeneralProgramDetailLnbTab(prev, {
        programId: options.programId,
        lnb: options.lnb,
        tab: options.tab,
        clearNested: options.clearNested,
      }),
    { replace: true }
  )
}

/** 상세 URL 조각 갱신 시 닫기 직후 클로저 programId로 programId가 복원되지 않도록 prev에 있을 때만 유지 */
export function preserveGeneralProgramDetailProgramId(
  prev: URLSearchParams,
  next: URLSearchParams
): void {
  const existingProgramId = prev.get('programId')
  if (existingProgramId) {
    next.set('programId', existingProgramId)
  }
}

export function shouldPatchGeneralProgramDetailUrl(prev: URLSearchParams): boolean {
  return Boolean(prev.get('programId'))
}

export function clearGeneralProgramDetailQueryParams(
  source: URLSearchParams
): URLSearchParams {
  const next = new URLSearchParams(source)
  for (const key of GENERAL_PROGRAM_DETAIL_QUERY_PARAMS) {
    next.delete(key)
  }
  return next
}

export function isParticipantRecruitmentPreviewOpen(
  searchParams: URLSearchParams
): boolean {
  return (
    searchParams.get(GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM) ===
    GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_ACTIVE
  )
}

export function isInstructorRecruitmentPreviewOpen(
  searchParams: URLSearchParams
): boolean {
  return (
    searchParams.get(GENERAL_PROGRAM_INSTRUCTOR_RECRUITMENT_PREVIEW_PARAM) ===
    GENERAL_PROGRAM_RECRUITMENT_PREVIEW_ACTIVE
  )
}

export function isVolunteerRecruitmentPreviewOpen(
  searchParams: URLSearchParams
): boolean {
  return (
    searchParams.get(GENERAL_PROGRAM_VOLUNTEER_RECRUITMENT_PREVIEW_PARAM) ===
    GENERAL_PROGRAM_RECRUITMENT_PREVIEW_ACTIVE
  )
}

export function clearGeneralProgramRecruitmentPreviewParams(
  next: URLSearchParams
): void {
  for (const key of GENERAL_PROGRAM_RECRUITMENT_PREVIEW_PARAMS) {
    next.delete(key)
  }
}

export function recruitmentPreviewParamForAudience(
  audience: 'institutions' | 'instructors' | 'volunteers'
): (typeof GENERAL_PROGRAM_RECRUITMENT_PREVIEW_PARAMS)[number] {
  switch (audience) {
    case 'instructors':
      return GENERAL_PROGRAM_INSTRUCTOR_RECRUITMENT_PREVIEW_PARAM
    case 'volunteers':
      return GENERAL_PROGRAM_VOLUNTEER_RECRUITMENT_PREVIEW_PARAM
    case 'institutions':
      return GENERAL_PROGRAM_PARTICIPANT_RECRUITMENT_PREVIEW_PARAM
    default: {
      const _exhaustive: never = audience
      return _exhaustive
    }
  }
}

export function readOpenRecruitmentPreviewAudience(
  searchParams: URLSearchParams
): 'institutions' | 'instructors' | 'volunteers' | null {
  if (isInstructorRecruitmentPreviewOpen(searchParams)) return 'instructors'
  if (isVolunteerRecruitmentPreviewOpen(searchParams)) return 'volunteers'
  if (isParticipantRecruitmentPreviewOpen(searchParams)) return 'institutions'
  return null
}
