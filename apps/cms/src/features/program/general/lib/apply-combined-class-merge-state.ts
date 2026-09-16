import {
  resolveCombinedClassMergeViewState,
  type OrganizationApplicationRowRef,
} from '@/features/program/general/lib/organization-merge-groups-mapper'
import type { MergeGroupResponse } from '@/shared/api/generated/dashboard/schemas/mergeGroupResponse'
import type { SchoolDetailForModal } from '@/features/program/general/model/school-detail-types'
import type { ApplicantInstitutionDetailExtend } from '@/features/program/shared/model/applicant-institution'

export function applyCombinedClassMergeToSchoolDetail(
  detail: SchoolDetailForModal,
  mergeGroups: MergeGroupResponse[] | undefined,
  row: OrganizationApplicationRowRef
): SchoolDetailForModal {
  if (!mergeGroups?.length) return detail
  const mergeState = resolveCombinedClassMergeViewState(mergeGroups, row, [row])
  return {
    ...detail,
    combinedClassApplication: mergeState.combinedClassApplication,
    combinedClassPartnerSchoolIds: mergeState.combinedClassPartnerIds,
    combinedClassPartnerGrades: mergeState.combinedClassPartnerGrades,
  }
}

export function applyCombinedClassMergeToSchoolDetailWithList(
  detail: SchoolDetailForModal,
  mergeGroups: MergeGroupResponse[] | undefined,
  row: OrganizationApplicationRowRef,
  allRows: OrganizationApplicationRowRef[]
): SchoolDetailForModal {
  if (!mergeGroups?.length) return detail
  const mergeState = resolveCombinedClassMergeViewState(mergeGroups, row, allRows)
  return {
    ...detail,
    combinedClassApplication: mergeState.combinedClassApplication,
    combinedClassPartnerSchoolIds: mergeState.combinedClassPartnerIds,
    combinedClassPartnerGrades: mergeState.combinedClassPartnerGrades,
  }
}

export function applyCombinedClassMergeToApplicantDetail(
  detail: ApplicantInstitutionDetailExtend | undefined,
  mergeGroups: MergeGroupResponse[] | undefined,
  row: OrganizationApplicationRowRef,
  allRows: OrganizationApplicationRowRef[]
): ApplicantInstitutionDetailExtend | undefined {
  if (!mergeGroups?.length) return detail
  const mergeState = resolveCombinedClassMergeViewState(mergeGroups, row, allRows)
  return {
    ...detail,
    combinedClassApplication: mergeState.combinedClassApplication,
    combinedClassPartnerApplicantIds: mergeState.combinedClassPartnerIds,
    combinedClassPartnerGrades: mergeState.combinedClassPartnerGrades,
  }
}
