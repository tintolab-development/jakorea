import type { ParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import { toCertificateStudentGender } from '@/features/program/general/lib/participating-individual-participant-certificate'
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
import type { UjatEducationProgressVolunteerDetail } from './detail/volunteer-detail-data'
import { sortVolunteerAssignmentRows } from './detail/volunteer-assignment-data'
import type {
  UjatVolunteerAssignmentProgressBundle,
  UjatVolunteerAssignmentProgressRow,
} from './detail/assignment-types'

/** 인증서 판정 — matrix cell.assignmentStatus=ASSIGNED 학급만. dash·포기·재배정 필요 제외 */
export function certificateJudgmentRows(
  bundle: UjatVolunteerAssignmentProgressBundle
): UjatVolunteerAssignmentProgressRow[] {
  return sortVolunteerAssignmentRows(bundle.rows).filter(
    row => row.classDisplay.kind === 'class' && row.canAssignAttendanceManager !== false
  )
}

export function hasUjatCertificateAssignment(
  bundle: UjatVolunteerAssignmentProgressBundle
): boolean {
  return certificateJudgmentRows(bundle).length > 0
}

export function resolveAssignedInstitutionNamesFromBundle(
  bundle: UjatVolunteerAssignmentProgressBundle
): string[] {
  return Array.from(
    new Set(
      certificateJudgmentRows(bundle)
        .map(row => (row.assignedInstitution.kind === 'name' ? row.assignedInstitution.value : null))
        .filter((value): value is string => Boolean(value))
    )
  )
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

export function buildLectureAttendanceSessionsFromBundle(
  bundle: UjatVolunteerAssignmentProgressBundle
): LectureAttendanceSession[] {
  return certificateJudgmentRows(bundle).map((row, index) => ({
    roundNumber: index + 1,
    status: mapAssignmentRowToLectureStatus(row),
  }))
}

function isAttendedForLectureCount(row: UjatVolunteerAssignmentProgressRow): boolean {
  // 출석 수: 출석·지각·사유결석 (불참만 제외). present+excused 정책에 지각 포함.
  return (
    row.attendance.kind === 'present' ||
    row.attendance.kind === 'late' ||
    row.attendance.kind === 'excused_absence'
  )
}

export function formatLectureAttendanceFromBundle(
  bundle: UjatVolunteerAssignmentProgressBundle
): string {
  const rows = certificateJudgmentRows(bundle)
  if (rows.length === 0) return '-'
  const attended = rows.filter(isAttendedForLectureCount).length
  return `${attended}/${rows.length}`
}

export function buildActivityCertificateVolunteerFromUjatDetail(
  detail: UjatEducationProgressVolunteerDetail,
  bundle: UjatVolunteerAssignmentProgressBundle
): ParticipatingVolunteerDetailRow {
  const { applicant, row } = detail

  const memberId = Number(applicant.memberId ?? row.memberId)

  return {
    id: detail.volunteerId,
    no: row.no,
    volunteerName: applicant.name,
    memberId: Number.isSafeInteger(memberId) && memberId > 0 ? memberId : undefined,
    id1365: applicant.id1365,
    assignedInstitutionNames: resolveAssignedInstitutionNamesFromBundle(bundle),
    sessions: [],
    contact: applicant.contact,
    email: applicant.email,
    contactRaw: applicant.contactRaw,
    emailRaw: applicant.emailRaw,
    gender: applicant.gender,
    birthDate: applicant.birthDate,
    age: applicant.age,
    /** 활동인증서 「소속」 줄 — 참여 봉사자 상세 「소속」과 같은 회원 프로필 소속 학교명 */
    affiliation: applicant.affiliationSchool.trim() || undefined,
    hasJaVolunteerExperience: applicant.hasEducationExperience === true,
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

function buildStudentRowFromUjatDetail(
  detail: UjatEducationProgressVolunteerDetail,
  bundle: UjatVolunteerAssignmentProgressBundle
): SchoolDetailStudentRow {
  const { applicant, row } = detail
  const assignedInstitutionName = resolveAssignedInstitutionNamesFromBundle(bundle)[0] ?? '-'

  return {
    id: detail.volunteerId,
    no: row.no,
    name: applicant.name,
    gender: toCertificateStudentGender(applicant.gender),
    birthDate: applicant.birthDate,
    gradeClass: applicant.grade,
    contact: applicant.contact,
    email: applicant.email,
    lectureAttendance: formatLectureAttendanceFromBundle(bundle),
    // UJAT는 학생 만족도 조사를 쓰지 않음(decision #27) — kind 판정은 satisfactionSurveyRequired:false만 사용.
    satisfactionSurveyCompleted: false,
    notes: assignedInstitutionName,
  }
}

export function buildStudentCertificateContextFromUjatVolunteer({
  detail,
  program,
  issuanceReasonLabel,
  bundle,
}: {
  detail: UjatEducationProgressVolunteerDetail
  program: Program
  issuanceReasonLabel: string
  bundle: UjatVolunteerAssignmentProgressBundle
}): StudentCertificateDownloadContext {
  const sessions = buildLectureAttendanceSessionsFromBundle(bundle)
  const certificateKind = resolveStudentCertificateKind({
    sessions,
    satisfactionSurveyRequired: false,
    satisfactionSurveyCompleted: false,
  })

  return buildStudentCertificateDownloadContext({
    student: buildStudentRowFromUjatDetail(detail, bundle),
    certificateKind,
    schoolName: resolveAssignedInstitutionNamesFromBundle(bundle)[0] ?? '-',
    educationGrade: detail.applicant.grade,
    programTitle: resolveProgramTitle(program),
    programStartDate: program.startDate,
    programEndDate: program.endDate,
    issuanceReasonLabel,
    programId: program.id,
  })
}

export const UJAT_CERTIFICATE_NO_ASSIGNMENT_ALERT =
  '배정 내역이 없어 발급할 수 없습니다.' as const

export function describeUjatCertificateProgressBlock(input: {
  isLoading: boolean
  isError: boolean
  isParticipantUnresolved: boolean
  /** 배정 행 0건이면 발급 차단 (FE-R3) */
  hasNoAssignment?: boolean
}): string | null {
  if (input.isLoading) return '배정/출결 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.'
  if (input.isError) return '배정/출결 정보를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.'
  if (input.isParticipantUnresolved) {
    return '봉사자 참가자를 확인할 수 없어 인증서를 발급할 수 없습니다.'
  }
  if (input.hasNoAssignment) return UJAT_CERTIFICATE_NO_ASSIGNMENT_ALERT
  return null
}
