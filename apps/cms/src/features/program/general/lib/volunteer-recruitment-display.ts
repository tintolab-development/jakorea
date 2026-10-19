/**
 * 일반 프로그램 상세 — 봉사자 모집 정보 표시값
 * SSOT: generalCommonInfo.volunteerRecruitmentInfo (모집 양식)
 * 모집 대상 / 모집 기간 / 문의처 — 공통정보 Program 폴백 없음. 빈값 '-'
 */

import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { getVolunteerRecruitmentStatus } from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { getGeneralVolunteerInterviewEnabled } from '@/features/program/general/lib/detail-meta'
import { resolveAnnouncement } from '@/features/program/shared/lib/announcement-label'
import {
  labelBool,
  pickDisplayString,
} from '@/features/program/general/lib/detail-value-helpers'
import { resolveRecruitmentRemarks } from '@/features/program/shared/lib/recruitment-row-copy'
import {
  operationPeriodLabelFromWindow,
  pickAudienceRecruitmentWindow,
  recruitmentPeriodLabelFromWindow,
} from '@/features/program/shared/lib/hydrate-recruitment-windows'

type VolunteerRecruitmentInfoLoose = NonNullable<
  NonNullable<Program['generalCommonInfo']>['volunteerRecruitmentInfo']
> & {
  announcementPublishedLabel?: string
  volunteerInterviewEnabled?: boolean
  generalVolunteerInterviewEnabled?: boolean
  volunteerInterviewEnabledLabel?: string
  finalAnnouncementLabel?: string
  resultAnnouncementLabel?: string
  documentPassAnnouncementDate?: string
  documentPassAnnouncementMethod?: string
  interviewStartDate?: string
  interviewEndDate?: string
  interviewMethod?: string
  finalPassAnnouncementDate?: string
  finalPassAnnouncementMethod?: string
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

export function resolveGeneralProgramVolunteerRecruitmentDisplay(
  program: Program
): GeneralProgramVolunteerRecruitmentDisplay {
  const common = program.generalCommonInfo
  const info = common?.volunteerRecruitmentInfo as VolunteerRecruitmentInfoLoose | undefined
  const row = pickAudienceRecruitmentWindow(program, 'volunteer')
  const lifecycle = resolveVolunteerRecruitmentLifecycle(program)

  const interviewEnabled =
    info?.volunteerInterviewEnabled ??
    info?.generalVolunteerInterviewEnabled ??
    program.generalVolunteerInterviewEnabled

  const finalAnnouncement = resolveAnnouncement({
    labels: [info?.finalAnnouncementLabel, info?.resultAnnouncementLabel],
    nested: { date: info?.finalPassAnnouncementDate, method: info?.finalPassAnnouncementMethod },
    column: {
      date: program.finalPassAnnouncementDate,
      method: program.finalPassAnnouncementMethod,
    },
  })

  const documentPassAnnouncementMethod = pickDisplayString(
    info?.documentPassAnnouncementMethod,
    program.documentPassAnnouncementMethod
  )
  const interviewMethod = pickDisplayString(info?.interviewMethod, program.interviewMethod)

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
      operationPeriodLabelFromWindow(row),
      info?.operationPeriodLabel
    ),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    volunteerTargetLabel: pickDisplayString(info?.recruitmentTarget),
    volunteerTargetDetailLabel: pickDisplayString(info?.recruitmentTargetDetail),
    recruitmentPeriodLabel: pickDisplayString(
      recruitmentPeriodLabelFromWindow(row),
      info?.recruitmentPeriodLabel
    ),
    documentPassAnnouncementDate:
      info?.documentPassAnnouncementDate ?? program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod:
      documentPassAnnouncementMethod === '-' ? undefined : documentPassAnnouncementMethod,
    interviewStartDate:
      row?.interviewStartAt ?? info?.interviewStartDate ?? program.interviewStartDate,
    interviewEndDate: row?.interviewEndAt ?? info?.interviewEndDate ?? program.interviewEndDate,
    interviewMethod: interviewMethod === '-' ? undefined : interviewMethod,
    finalPassAnnouncementDate: finalAnnouncement.date,
    finalPassAnnouncementMethod: finalAnnouncement.method,
    contactOrganizationName: pickDisplayString(
      row?.contactName,
      info?.contactOrganizationName
    ),
    contactPhone: pickDisplayString(
      row?.contactPhone,
      info?.inquiryTel,
      info?.tel,
      info?.contactPhone
    ),
    contactEmail: pickDisplayString(
      row?.contactEmail,
      info?.inquiryEmail,
      info?.email,
      info?.contactEmail
    ),
    notes: info?.notesNotApplicable
      ? '-'
      : pickDisplayString(resolveRecruitmentRemarks(program, 'volunteer')),
  }
}
