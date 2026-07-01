import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { TabKey } from '@/features/program/general/ui/detail-modal/program-detail-nav-types'

export function filterApplicantsTableData(
  menu: TabKey | '',
  institutionList: ApplicantSchoolRow[],
  instructorList: ApplicantInstructorRow[],
  appliedFilters: Record<string, any>
): ApplicantSchoolRow[] | ApplicantInstructorRow[] {
  if (menu === 'institutions') {
    return institutionList.filter(item => {
      const {
        organizationName,
        region,
        institutionSido,
        institutionSigungu,
        grade,
        teacherName,
        approvalStatus,
      } = appliedFilters
      if (
        organizationName &&
        organizationName.trim() !== '' &&
        !item.schoolName.includes(organizationName)
      )
        return false
      if (region && region !== 'all' && !item.region.includes(region)) return false
      if (
        institutionSido &&
        institutionSido !== 'all' &&
        !item.region.includes(String(institutionSido))
      )
        return false
      if (
        institutionSigungu &&
        institutionSigungu !== 'all' &&
        !item.region.includes(String(institutionSigungu))
      )
        return false
      if (grade && grade !== 'all' && item.educationGrade !== grade) return false
      if (teacherName && teacherName.trim() !== '' && !item.teacherName.includes(teacherName))
        return false
      if (approvalStatus && approvalStatus !== 'all' && item.approvalStatus !== approvalStatus)
        return false
      return true
    })
  }
  if (menu === 'instructors') {
    return instructorList.filter(item => {
      const {
        schoolNames,
        instructorName,
        residenceRegion,
        evaluationGrade,
        teachingExperience,
        approvalStatus,
      } = appliedFilters
      const names = Array.isArray(schoolNames) ? (schoolNames as string[]) : []
      if (names.length > 0 && !names.includes(item.schoolName)) return false
      if (
        instructorName &&
        instructorName.trim() !== '' &&
        !item.instructorName.includes(instructorName)
      )
        return false
      if (residenceRegion && residenceRegion !== 'all' && !item.address.includes(residenceRegion))
        return false
      if (
        evaluationGrade &&
        evaluationGrade !== 'all' &&
        item.evaluationGrade !== evaluationGrade
      )
        return false
      if (
        teachingExperience &&
        teachingExperience !== 'all' &&
        item.teachingExperience !== teachingExperience
      )
        return false
      if (approvalStatus && approvalStatus !== 'all' && item.approvalStatus !== approvalStatus)
        return false
      return true
    })
  }
  return []
}
