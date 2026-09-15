/**
 * 일반 프로그램 상세 — 봉사자 모집 정보 표시값
 * Primary: generalCommonInfo.volunteerRecruitmentInfo + typed Program fields
 * 빈값 '-' (JOB담 mock / 후원사명 등 비관련 폴백 없음)
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
    contactOrganizationName: pickDisplayString(info?.contactOrganizationName),
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
