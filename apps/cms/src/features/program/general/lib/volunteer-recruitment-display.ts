/**
 * 일반 프로그램 상세 — 봉사자 모집 정보 표시값
 * SSOT: generalCommonInfo.volunteerRecruitmentInfo (모집 양식)
 * 모집 대상 / 모집 기간 / 문의처 — 공통정보 Program 폴백 없음. 빈값 '-'
 */

import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  getRecruitmentStatusFromDates,
  getRecruitmentStatusLabelForStatus,
  type RecruitmentStatus,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getGeneralVolunteerInterviewEnabled } from '@/features/program/general/lib/detail-meta'
import { resolveAnnouncement } from '@/features/program/shared/lib/announcement-label'
import {
  labelBool,
  pickDisplayString,
} from '@/features/program/general/lib/detail-value-helpers'
import { audienceOperationPeriodLabelFromRecruitmentRow } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import { resolveRecruitmentRemarks } from '@/features/program/shared/lib/recruitment-row-copy'
import {
  hasRecruitmentWindows,
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

function resolveVolunteerRecruitmentLifecycle(
  status: RecruitmentStatus | null
): ProgramLifecycleStatus | null {
  if (status == null) return null
  return VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE[status]
}

export function resolveGeneralProgramVolunteerRecruitmentDisplay(
  program: Program
): GeneralProgramVolunteerRecruitmentDisplay {
  const common = program.generalCommonInfo
  const info = common?.volunteerRecruitmentInfo as VolunteerRecruitmentInfoLoose | undefined
  const row = pickAudienceRecruitmentWindow(program, 'volunteer')
  const useRow = hasRecruitmentWindows(program)
  const recruitmentStatus = getRecruitmentStatusFromDates(
    useRow ? row?.startAt ?? undefined : program.volunteerApplicationStartDate,
    useRow ? row?.endAt ?? undefined : program.volunteerApplicationEndDate
  )
  const lifecycle = resolveVolunteerRecruitmentLifecycle(recruitmentStatus)

  const interviewEnabled = useRow
    ? (row?.interviewEnabled ??
      info?.volunteerInterviewEnabled ??
      info?.generalVolunteerInterviewEnabled ??
      program.generalVolunteerInterviewEnabled)
    : (info?.volunteerInterviewEnabled ??
      info?.generalVolunteerInterviewEnabled ??
      program.generalVolunteerInterviewEnabled)

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
      audienceOperationPeriodLabelFromRecruitmentRow(program, 'volunteer'),
      useRow ? undefined : info?.operationPeriodLabel
    ),
    recruitmentStatusLabel: getRecruitmentStatusLabelForStatus(recruitmentStatus, 'volunteer'),
    recruitmentStatusLifecycle: lifecycle,
    volunteerTargetLabel: pickDisplayString(info?.recruitmentTarget),
    volunteerTargetDetailLabel: pickDisplayString(info?.recruitmentTargetDetail),
    recruitmentPeriodLabel: pickDisplayString(
      recruitmentPeriodLabelFromWindow(row),
      useRow ? undefined : info?.recruitmentPeriodLabel
    ),
    documentPassAnnouncementDate:
      info?.documentPassAnnouncementDate ?? program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod:
      documentPassAnnouncementMethod === '-' ? undefined : documentPassAnnouncementMethod,
    interviewStartDate: useRow
      ? row?.interviewStartAt ?? undefined
      : (info?.interviewStartDate ?? program.interviewStartDate),
    interviewEndDate: useRow
      ? row?.interviewEndAt ?? undefined
      : (info?.interviewEndDate ?? program.interviewEndDate),
    interviewMethod: interviewMethod === '-' ? undefined : interviewMethod,
    finalPassAnnouncementDate: finalAnnouncement.date,
    finalPassAnnouncementMethod: finalAnnouncement.method,
    contactOrganizationName: pickDisplayString(
      row?.contactName,
      useRow ? undefined : info?.contactOrganizationName
    ),
    contactPhone: pickDisplayString(
      row?.contactPhone,
      useRow ? undefined : info?.inquiryTel,
      useRow ? undefined : info?.tel,
      useRow ? undefined : info?.contactPhone
    ),
    contactEmail: pickDisplayString(
      row?.contactEmail,
      useRow ? undefined : info?.inquiryEmail,
      useRow ? undefined : info?.email,
      useRow ? undefined : info?.contactEmail
    ),
    notes: info?.notesNotApplicable
      ? '-'
      : pickDisplayString(resolveRecruitmentRemarks(program, 'volunteer')),
  }
}
