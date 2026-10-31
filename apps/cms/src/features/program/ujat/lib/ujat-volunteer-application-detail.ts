import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchVolunteerApplicationDetailRemote } from '@/features/program/general/api/applications-api-client'
import { mapVolunteerInterviewAssignmentFromWire } from '@/features/program/general/api/adapters/general-applications-adapters'
import { formatAssignedInterviewFromIso } from '@/features/program/ujat/api/applications-adapters'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { readVolunteerApplicationAttachments } from '@/features/program/general/lib/volunteer-application-evidence'
import type { VolunteerApplicationEvidenceAttachment } from '@/features/program/general/model/volunteer-applicant'
import type { Profile } from '@/shared/api/generated/dashboard/schemas/profile'
import { toGenderLabelOrRaw } from '@/features/user/api/map-member-gender-birth'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { mapUjatVolunteerGradeLabel } from '@/features/program/ujat/model/ujat-volunteer-screening-constants'

const UJAT_PREVIOUS_TERM_QUESTION_KEY = 'ujat-program-application-volunteer-seed-previous-term'

type UjatProjection = {
  universityName?: string | null
  grade?: string | null
  gradeLabel?: string | null
  major?: string | null
  applicationRoute?: string | null
  applicationRouteLabel?: string | null
  applicationRouteOther?: string | null
  applicationType?: string | null
  previousActivityTerm?: string | null
  previousActivityYear?: string | null
  essayIntro?: string | null
  essayEducationExperience?: string | null
  essayNecessity?: string | null
  essayJaExperience?: string | null
  preferredActivityRegion?: string | null
  educationExperience?: string | null
  educationExperienceYn?: boolean | null
}

function text(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function gradeFromProjection(projection: UjatProjection): string | null {
  const fromLabel = text(projection.gradeLabel)
  if (fromLabel) return fromLabel
  const fromCode = text(projection.grade)
  return fromCode || null
}

function projectionGradeToRowGrade(projection: UjatProjection): UjatVolunteerApplicantRow['grade'] {
  const raw = gradeFromProjection(projection)
  if (!raw) return ''
  if (raw === '휴학생') return '휴학'
  return mapUjatVolunteerGradeLabel(raw)
}

export function applyUjatVolunteerProjection(
  row: UjatVolunteerApplicantRow,
  projection: UjatProjection | null | undefined,
  attachments: readonly VolunteerApplicationEvidenceAttachment[],
): UjatVolunteerApplicantRow {
  if (!projection && attachments.length === 0) return row
  const source = projection ?? {}
  const grade = projectionGradeToRowGrade(source)
  const applicationType =
    source.applicationType === 'ujat-graduate' || source.applicationType === 'new'
      ? source.applicationType
      : row.applicationType
  const term = text(source.previousActivityTerm)
  const year = text(source.previousActivityYear)
  const certificate = attachments.find(file => file.questionKey === UJAT_PREVIOUS_TERM_QUESTION_KEY)
  const hasEducationExperience =
    typeof source.educationExperienceYn === 'boolean'
      ? source.educationExperienceYn
      : row.hasEducationExperience

  return {
    ...row,
    universityName: text(source.universityName) || row.universityName,
    grade: grade || row.grade,
    major: text(source.major) || row.major,
    applicationRoute: text(source.applicationRouteLabel) || text(source.applicationRoute) || row.applicationRoute,
    applicationRouteOther: text(source.applicationRouteOther) || row.applicationRouteOther,
    applicationType,
    preferredRegion: text(source.preferredActivityRegion) || row.preferredRegion,
    hasEducationExperience,
    essayIntro: 'essayIntro' in source ? text(source.essayIntro) : row.essayIntro,
    essayEducationExperience:
      'essayEducationExperience' in source
        ? text(source.essayEducationExperience)
        : row.essayEducationExperience,
    essayNecessity: 'essayNecessity' in source ? text(source.essayNecessity) : row.essayNecessity,
    essayJaExperience:
      'essayJaExperience' in source ? text(source.essayJaExperience) : row.essayJaExperience,
    previousUjatActivity:
      term || year
        ? {
            term,
            year,
            certificateFileName: certificate?.originalFileName ?? '',
          }
        : row.previousUjatActivity,
    evidenceAttachments: [...attachments],
  }
}

function readProjection(application: unknown): UjatProjection | null {
  if (!application || typeof application !== 'object') return null
  const ujat = (application as { ujat?: unknown }).ujat
  if (!ujat || typeof ujat !== 'object') return null
  return ujat as UjatProjection
}

function applyVolunteerProfile(
  row: UjatVolunteerApplicantRow,
  profile: Profile | null | undefined,
): UjatVolunteerApplicantRow {
  if (!profile) return row
  const contact = text(profile.contact)
  const email = text(profile.email)
  return {
    ...row,
    name: text(profile.name) || row.name,
    gender: toGenderLabelOrRaw(profile.gender) || row.gender,
    birthDate: text(profile.birthDate) || row.birthDate,
    age: typeof profile.age === 'number' ? profile.age : row.age,
    contact: contact || row.contact,
    email: email || row.email,
    contactRaw: contact || row.contactRaw,
    emailRaw: email || row.emailRaw,
    id1365: text(profile.external1365Id) || row.id1365,
    /** MASKED는 homeAddress(시/도) 또는 homeAddressSido. sigungu로 보완하지 않음. */
    homeAddress: text(profile.homeAddress) || text(profile.homeAddressSido) || row.homeAddress,
  }
}

/** 상세·마스킹 해제 응답의 `application`·`profile`에서 UJAT 항목을 덮어쓴다 */
export function applyUjatVolunteerApplicationDetail(
  row: UjatVolunteerApplicantRow,
  application: unknown,
  profile?: Profile | null,
): UjatVolunteerApplicantRow {
  return applyVolunteerProfile(
    applyUjatVolunteerProjection(
      row,
      readProjection(application),
      readVolunteerApplicationAttachments(application),
    ),
    profile,
  )
}

/** UJAT 봉사자 상세 — 공용 volunteer-applications 상세의 ujat projection·첨부 */
export function useUjatVolunteerApplicationDetailEnrichment(
  row: UjatVolunteerApplicantRow,
): UjatVolunteerApplicantRow {
  const applicationId = Number(row.id)
  const detailQuery = useQuery({
    queryKey: ujatQueryKeys.volunteerApplicationDetail(row.id),
    queryFn: () => fetchVolunteerApplicationDetailRemote(String(row.id)),
    enabled: Number.isFinite(applicationId) && applicationId > 0,
    staleTime: 30_000,
    retry: false,
  })

  return useMemo(() => {
    if (!detailQuery.data) return row
    const dto = detailQuery.data
    const enriched = applyUjatVolunteerApplicationDetail(row, dto.application, dto.profile)
    const assignment = mapVolunteerInterviewAssignmentFromWire({
      interviewStatus: dto.interviewStatus,
      interviewAssignmentStatus: dto.interviewAssignmentStatus,
      applicationStatus: dto.applicationStatus,
      giveUpYn: dto.screening?.giveUpYn,
    })
    const assigned = formatAssignedInterviewFromIso(
      dto.assignedInterviewStartAt,
      dto.assignedInterviewEndAt
    )
    return {
      ...enriched,
      interviewAssignmentStatus:
        assignment === 'waiting' || assignment === 'not_required'
          ? enriched.interviewAssignmentStatus
          : assignment,
      ...(dto.interviewAssignmentId != null
        ? { interviewAssignmentId: dto.interviewAssignmentId }
        : {}),
      assignedInterviewStartAt:
        dto.assignedInterviewStartAt === null
          ? undefined
          : dto.assignedInterviewStartAt?.trim() || enriched.assignedInterviewStartAt,
      assignedInterviewEndAt:
        dto.assignedInterviewEndAt === null
          ? undefined
          : dto.assignedInterviewEndAt?.trim() || enriched.assignedInterviewEndAt,
      assignedInterviewDateLabel:
        assigned.assignedInterviewDateLabel ??
        (dto.assignedInterviewStartAt == null ? undefined : enriched.assignedInterviewDateLabel),
      assignedInterviewTime:
        assigned.assignedInterviewTime ??
        (dto.assignedInterviewStartAt == null ? undefined : enriched.assignedInterviewTime),
    }
  }, [detailQuery.data, row])
}
