import type { ParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import {
  buildStudentCertificateDownloadContext,
  type StudentCertificateDownloadContext,
} from '@/features/program/general/lib/build-student-certificate-issuance'
import { resolveStudentCertificateKind } from '@/features/program/general/lib/resolve-student-certificate-kind'
import type {
  LectureAttendanceSession,
  LectureAttendanceStatusKey,
  SchoolDetailStudentRow,
} from '@/features/program/general/model/school-detail-types'
import type { Program } from '@/types/domain'
import type { UjatEducationProgressVolunteerDetail } from './detail/detail-mock'
import { getUjatVolunteerAssignmentProgressBundle } from './detail/assignment-mock'
import type { UjatVolunteerAssignmentProgressRow } from './detail/assignment-types'

function resolveAssignedInstitutionNames(volunteerId: string): string[] {
  return Array.from(
    new Set(
      getUjatVolunteerAssignmentProgressBundle(volunteerId).rows
        .map(row => (row.assignedInstitution.kind === 'name' ? row.assignedInstitution.value : null))
        .filter((value): value is string => Boolean(value))
    )
  )
}

export function buildActivityCertificateVolunteerFromUjatDetail(
  detail: UjatEducationProgressVolunteerDetail
): ParticipatingVolunteerDetailRow {
  const { applicant, row } = detail

  return {
    id: detail.volunteerId,
    no: row.no,
    volunteerName: applicant.name,
    id1365: applicant.id1365,
    assignedInstitutionNames: resolveAssignedInstitutionNames(detail.volunteerId),
    sessions: [],
    contact: applicant.contact,
    email: applicant.email,
    contactRaw: applicant.contactRaw,
    emailRaw: applicant.emailRaw,
    gender: applicant.gender,
    birthDate: applicant.birthDate,
    age: applicant.age,
    hasJaVolunteerExperience: applicant.hasEducationExperience,
    applicationType: applicant.applicationType === 'ujat-graduate' ? 'ujat-graduate' : 'new',
    adminComment: detail.adminComment,
    activityWithdrawn: row.assignmentStatus === 'activity_abandoned',
    essayIntro: applicant.essayIntro,
    essayEducationExperience: applicant.essayEducationExperience,
    essayNecessity: applicant.essayNecessity,
    essayJaExperience: applicant.essayJaExperience,
  }
}

function resolveProgramTitle(program: Program): string {
  return program.mainTitle?.trim() || program.title?.trim() || 'UJAT'
}

function mapAssignmentRowToLectureStatus(
  row: UjatVolunteerAssignmentProgressRow
): LectureAttendanceStatusKey {
  if (row.educationProgress !== 'completed') return 'not_held'
  if (row.attendance.kind === 'late') return 'late'
  if (row.attendance.kind === 'absence') return 'absent'
  if (row.attendance.kind === 'present' || row.attendance.kind === 'excused_absence') {
    return 'attended'
  }
  return 'not_held'
}

function buildLectureAttendanceSessions(volunteerId: string): LectureAttendanceSession[] {
  return getUjatVolunteerAssignmentProgressBundle(volunteerId).rows.map((row, index) => ({
    roundNumber: index + 1,
    status: mapAssignmentRowToLectureStatus(row),
  }))
}

function buildStudentRowFromUjatDetail(
  detail: UjatEducationProgressVolunteerDetail
): SchoolDetailStudentRow {
  const { applicant, row } = detail
  const assignedInstitutionName = resolveAssignedInstitutionNames(detail.volunteerId)[0] ?? '-'

  return {
    id: detail.volunteerId,
    no: row.no,
    name: applicant.name,
    gender: applicant.gender === '남성' || applicant.gender === '남' ? 'male' : 'female',
    birthDate: applicant.birthDate,
    gradeClass: applicant.grade,
    contact: applicant.contact,
    email: applicant.email,
    lectureAttendance: `${row.totalAssignmentDays ?? 0}/${Math.max(row.totalAssignmentDays ?? 0, 1)}`,
    satisfactionSurveyCompleted: true,
    notes: assignedInstitutionName,
  }
}

export function buildStudentCertificateContextFromUjatVolunteer({
  detail,
  program,
  issuanceReasonLabel,
}: {
  detail: UjatEducationProgressVolunteerDetail
  program: Program
  issuanceReasonLabel: string
}): StudentCertificateDownloadContext {
  const sessions = buildLectureAttendanceSessions(detail.volunteerId)
  const certificateKind = resolveStudentCertificateKind({
    sessions,
    satisfactionSurveyRequired: false,
    satisfactionSurveyCompleted: true,
  })

  return buildStudentCertificateDownloadContext({
    student: buildStudentRowFromUjatDetail(detail),
    certificateKind,
    schoolName: resolveAssignedInstitutionNames(detail.volunteerId)[0] ?? '-',
    educationGrade: detail.applicant.grade,
    programTitle: resolveProgramTitle(program),
    programStartDate: program.startDate,
    programEndDate: program.endDate,
    issuanceReasonLabel,
    programId: program.id,
  })
}
