import { getUjatEducationProgressInstitutions } from '@/data/mock/ujat-education-progress-institutions-mock'
import type { EducationProgressHalfKey } from '../../ujat-education-progress-tabs'
import {
  UJAT_DETAIL_LNB_PARAM,
  UJAT_DETAIL_TAB_PARAM,
  UJAT_EDU_INST_ID_PARAM,
  UJAT_EDU_INST_TAB_PARAM,
  type UjatEducationProgressInstitutionDetailTab,
} from '@/features/program/ujat/lib/ujat-program-detail-url'

export function educationProgressHalfFromTab(tab: string): EducationProgressHalfKey {
  return tab.startsWith('edu_h2') ? 'h2' : 'h1'
}

export function isEducationProgressInstitutionsTab(tab: string): boolean {
  return /^edu_h[12]_institutions$/.test(tab)
}

export function resolveSourceInstitutionIdFromProgressRowId(rowId: string): string {
  const match = rowId.match(/^h[12]-(.+)$/)
  return match?.[1] ?? rowId
}

export function isUjatEducationProgressInstitutionInList(
  programId: string,
  half: EducationProgressHalfKey,
  institutionId: string
): boolean {
  return getUjatEducationProgressInstitutions(programId, half).some(
    row => row.sourceInstitutionId === institutionId
  )
}

export function buildUjatEducationProgressInstitutionDetailUrl(
  programId: string,
  tab: string,
  institutionId: string,
  detailTab: UjatEducationProgressInstitutionDetailTab = 'application'
): string {
  const q = new URLSearchParams({
    programId,
    [UJAT_DETAIL_LNB_PARAM]: 'education_progress',
    [UJAT_DETAIL_TAB_PARAM]: tab,
    [UJAT_EDU_INST_ID_PARAM]: institutionId,
    [UJAT_EDU_INST_TAB_PARAM]: detailTab,
  })
  return `/programs/ujat?${q.toString()}`
}
