import type { EducationProgressHalfKey } from '@/features/program/ujat/ui/detail-modal/progress/ujat-education-progress-tabs'
import type { UjatEducationProgressVolunteerRow } from '@/features/program/ujat/ui/detail-modal/progress/volunteers/types'
import {
  buildUjatEducationProgressVolunteerRowId,
  getUjatVolunteerMockProfilesResolved,
  regionLabelForVolunteerProfile,
} from '@/data/mock/ujat-volunteer-mock-profiles'

export function getUjatEducationProgressVolunteerMockRows(
  half: EducationProgressHalfKey
): UjatEducationProgressVolunteerRow[] {
  const profiles = getUjatVolunteerMockProfilesResolved()
  const total = profiles.length
  return profiles.map((profile, index) => ({
    id: buildUjatEducationProgressVolunteerRowId(half, profile.id),
    no: total - index,
    volunteerName: profile.name,
    grade: profile.grade,
    regionKey: profile.regionKey,
    regionLabel: regionLabelForVolunteerProfile(profile.regionKey),
    mobile: profile.mobile,
    email: profile.email,
    totalAssignmentDays: profile.totalAssignmentDays,
    assignmentStatus: profile.assignmentStatus,
  }))
}
