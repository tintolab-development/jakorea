import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchVolunteerApplicationDetailRemote } from '@/features/program/general/api/applications-api-client'
import { readVolunteerApplicationAttachments } from '@/features/program/general/lib/volunteer-application-evidence'
import type { VolunteerApplicationEvidenceAttachment } from '@/features/program/general/model/volunteer-applicant'
import {
  UJAT_VOLUNTEER_GRADE_OPTIONS,
  type UjatVolunteerGrade,
} from '@/features/program/ujat/model/ujat-volunteer-screening-constants'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'

const UJAT_PREVIOUS_TERM_QUESTION_KEY = 'ujat-program-application-volunteer-seed-previous-term'

const GRADE_BY_CODE: Record<string, UjatVolunteerGrade> = {
  '1': '1학년',
  '2': '2학년',
  '3': '3학년',
  '4': '4학년',
  leave: '휴학생',
  deferred: '졸업유예',
}

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

function gradeFromProjection(projection: UjatProjection): UjatVolunteerGrade | null {
  const label = text(projection.gradeLabel)
  if ((UJAT_VOLUNTEER_GRADE_OPTIONS as readonly string[]).includes(label)) {
    return label as UjatVolunteerGrade
  }
  return GRADE_BY_CODE[text(projection.grade)] ?? null
}

export function applyUjatVolunteerProjection(
  row: UjatVolunteerApplicantRow,
  projection: UjatProjection | null | undefined,
  attachments: readonly VolunteerApplicationEvidenceAttachment[],
): UjatVolunteerApplicantRow {
  if (!projection && attachments.length === 0) return row
  const source = projection ?? {}
  const grade = gradeFromProjection(source)
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
    grade: grade ?? row.grade,
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

/** 상세·마스킹 해제 응답의 `application`에서 UJAT 항목과 첨부를 덮어쓴다 */
export function applyUjatVolunteerApplicationDetail(
  row: UjatVolunteerApplicantRow,
  application: unknown,
): UjatVolunteerApplicantRow {
  return applyUjatVolunteerProjection(
    row,
    readProjection(application),
    readVolunteerApplicationAttachments(application),
  )
}

/** UJAT 봉사자 상세 — 공용 volunteer-applications 상세의 ujat projection·첨부 */
export function useUjatVolunteerApplicationDetailEnrichment(
  row: UjatVolunteerApplicantRow,
): UjatVolunteerApplicantRow {
  const applicationId = Number(row.id)
  const detailQuery = useQuery({
    queryKey: ['ujat', 'volunteer-application-detail', row.id],
    queryFn: () => fetchVolunteerApplicationDetailRemote(String(row.id)),
    enabled: Number.isFinite(applicationId) && applicationId > 0,
    staleTime: 30_000,
    retry: false,
  })

  return useMemo(() => {
    if (!detailQuery.data) return row
    return applyUjatVolunteerProjection(
      row,
      readProjection(detailQuery.data.application),
      readVolunteerApplicationAttachments(detailQuery.data.application),
    )
  }, [detailQuery.data, row])
}
