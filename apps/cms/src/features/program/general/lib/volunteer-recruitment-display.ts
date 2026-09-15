/**
 * 일반 프로그램 상세 — 봉사자 모집 정보 표시값
 * Primary 8 SoT: generalCommonInfo.volunteerRecruitmentInfo + typed fallback
 * mock 프로그램(id)만 JOB담 샘플 표시 · 그 외는 하드코드 기본값 없이 빈값 '-'
 */

import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  formatDateRange,
  formatVolunteerTargetsLabel,
  getVolunteerRecruitmentStatus,
  resolveProgramVolunteerTargets,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { getGeneralVolunteerInterviewEnabled } from '@/features/program/general/lib/detail-meta'
import { GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID } from '@/features/program/general/lib/detail-common-info-display'
import {
  labelBool,
  pickDisplayString,
} from '@/features/program/general/lib/detail-value-helpers'

type VolunteerRecruitmentInfoLoose = NonNullable<
  NonNullable<Program['generalCommonInfo']>['volunteerRecruitmentInfo']
> & {
  announcementPublishedLabel?: string
  volunteerInterviewEnabled?: boolean
  generalVolunteerInterviewEnabled?: boolean
  volunteerInterviewEnabledLabel?: string
  finalAnnouncementLabel?: string
  resultAnnouncementLabel?: string
  inquiryTel?: string
  inquiryEmail?: string
  tel?: string
  email?: string
  remarks?: string
  recruitmentTarget?: string
  recruitmentTargetDetail?: string
  contactPhone?: string
  contactEmail?: string
}

export function resolveVolunteerRecruitmentInterviewEnabled(
  program: Program,
  editInterviewValue?: 'yes' | 'no'
): boolean {
  if (editInterviewValue === 'yes') return true
  if (editInterviewValue === 'no') return false
  return getGeneralVolunteerInterviewEnabled(program)
}

const VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'volunteer_recruitment_planned',
  recruiting: 'recruiting_volunteers',
  closed: 'document_processing_completed',
}

export type GeneralProgramVolunteerRecruitmentDisplay = {
  announcementPublishedLabel: string
  interviewEnabledLabel: string
  operationPeriodLabel: string
  recruitmentStatusLabel: string
  recruitmentStatusLifecycle: ProgramLifecycleStatus | null
  volunteerTargetLabel: string
  volunteerTargetDetailLabel: string
  recruitmentPeriodLabel: string
  documentPassAnnouncementDate?: string | Date
  documentPassAnnouncementMethod?: string
  interviewStartDate?: string | Date
  interviewEndDate?: string | Date
  interviewMethod?: string
  finalPassAnnouncementDate?: string | Date
  finalPassAnnouncementMethod?: string
  contactOrganizationName: string
  contactPhone: string
  contactEmail: string
  notes: string
}

const JOB담_VOLUNTEER_RECRUITMENT_MOCK = {
  announcementPublishedLabel: '게시',
  interviewEnabledLabel: '면접 있음',
  operationPeriodLabel: '2026. 03. 04(수) ~ 2026. 12. 30(수)',
  recruitmentPeriodLabel: '2026. 01. 05(월) ~ 2026. 01. 28(수)',
  documentPassAnnouncementDate: '2026-02-03T00:00:00+09:00',
  documentPassAnnouncementMethod: '홈페이지 공지 및 합격자 개별 안내',
  interviewStartDate: '2026-02-09T00:00:00+09:00',
  interviewEndDate: '2026-02-13T00:00:00+09:00',
  interviewMethod: '온라인',
  finalPassAnnouncementDate: '2026-02-20T00:00:00+09:00',
  finalPassAnnouncementMethod: '홈페이지 공지 및 합격자 개별 안내',
  contactOrganizationName: 'JA Korea',
  contactPhone: '02-6085-6028',
  contactEmail: 'cc@jakorea.org',
  volunteerTargetLabel: '대학(원)생',
  volunteerTargetDetailLabel: '-',
  notes: '-',
} as const

function resolveVolunteerRecruitmentLifecycle(program: Program): ProgramLifecycleStatus | null {
  const status = getVolunteerRecruitmentStatus(program)
  if (status == null) return null
  return VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE[status]
}

function resolveVolunteerPeriod(program: Program, info?: VolunteerRecruitmentInfoLoose) {
  if (info?.recruitmentPeriodLabel?.trim()) {
    return info.recruitmentPeriodLabel.trim()
  }
  return formatDateRange(
    program.volunteerApplicationStartDate,
    program.volunteerApplicationEndDate
  )
}

export function resolveGeneralProgramVolunteerRecruitmentDisplay(
  program: Program
): GeneralProgramVolunteerRecruitmentDisplay {
  const common = program.generalCommonInfo
  const info = common?.volunteerRecruitmentInfo as VolunteerRecruitmentInfoLoose | undefined
  const lifecycle = resolveVolunteerRecruitmentLifecycle(program)

  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID) {
    return {
      ...JOB담_VOLUNTEER_RECRUITMENT_MOCK,
      recruitmentStatusLabel: getProgramLifecycleLabel('recruiting_volunteers'),
      recruitmentStatusLifecycle: 'recruiting_volunteers',
    }
  }

  const interviewEnabled =
    info?.volunteerInterviewEnabled ??
    info?.generalVolunteerInterviewEnabled ??
    program.generalVolunteerInterviewEnabled

  const finalPassAnnouncementMethod = pickDisplayString(
    info?.finalAnnouncementLabel,
    info?.resultAnnouncementLabel,
    program.finalPassAnnouncementMethod
  )

  return {
    announcementPublishedLabel: pickDisplayString(
      info?.announcementPublishedLabel,
      labelBool(info?.announcementPublished, '게시', '미게시')
    ),
    interviewEnabledLabel: pickDisplayString(
      info?.volunteerInterviewEnabledLabel,
      labelBool(interviewEnabled, '면접 있음', '면접 없음')
    ),
    operationPeriodLabel: pickDisplayString(
      info?.operationPeriodLabel,
      formatDateRange(program.startDate, program.endDate)
    ),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    volunteerTargetLabel: pickDisplayString(
      info?.recruitmentTarget,
      formatVolunteerTargetsLabel(resolveProgramVolunteerTargets(program))
    ),
    volunteerTargetDetailLabel: pickDisplayString(
      info?.recruitmentTargetDetail,
      program.volunteerTargetDetail
    ),
    recruitmentPeriodLabel: resolveVolunteerPeriod(program, info),
    documentPassAnnouncementDate: program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: program.documentPassAnnouncementMethod,
    interviewStartDate: program.interviewStartDate,
    interviewEndDate: program.interviewEndDate,
    interviewMethod: program.interviewMethod,
    finalPassAnnouncementDate: program.finalPassAnnouncementDate,
    finalPassAnnouncementMethod:
      finalPassAnnouncementMethod === '-' ? undefined : finalPassAnnouncementMethod,
    contactOrganizationName: pickDisplayString(
      info?.contactOrganizationName,
      common?.sponsorDisplayName
    ),
    contactPhone: pickDisplayString(
      info?.inquiryTel,
      info?.tel,
      info?.contactPhone,
      program.contactPhone
    ),
    contactEmail: pickDisplayString(
      info?.inquiryEmail,
      info?.email,
      info?.contactEmail,
      program.contactEmail
    ),
    notes: pickDisplayString(info?.remarks, program.otherNotes, program.oneLineIntroduction),
  }
}
