/**
 * 일반 프로그램 상세 — 봉사자 모집 정보 표시값
 * 값 없으면 '-' (mock/하드코드 기본값 없음)
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

function needOrNotLabel(value: boolean | undefined, yes = '게시', no = '미게시'): string {
  if (value == null) return '-'
  return value ? yes : no
}

function interviewEnabledLabel(value: boolean | undefined): string {
  if (value == null) return '-'
  return value ? '면접 있음' : '면접 없음'
}

function dashOr(value: string | undefined | null): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

function resolveVolunteerRecruitmentLifecycle(program: Program): ProgramLifecycleStatus | null {
  const status = getVolunteerRecruitmentStatus(program)
  if (status == null) return null
  return VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE[status]
}

function resolveVolunteerPeriod(program: Program, info?: Program['generalCommonInfo']) {
  const volunteerRecruitmentInfo = info?.volunteerRecruitmentInfo
  if (volunteerRecruitmentInfo?.recruitmentPeriodLabel?.trim()) {
    return volunteerRecruitmentInfo.recruitmentPeriodLabel.trim()
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
  const info = common?.volunteerRecruitmentInfo
  const lifecycle = resolveVolunteerRecruitmentLifecycle(program)

  return {
    announcementPublishedLabel: needOrNotLabel(info?.announcementPublished),
    interviewEnabledLabel: interviewEnabledLabel(program.generalVolunteerInterviewEnabled),
    operationPeriodLabel:
      info?.operationPeriodLabel?.trim() ||
      formatDateRange(program.startDate, program.endDate),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    volunteerTargetLabel: formatVolunteerTargetsLabel(resolveProgramVolunteerTargets(program)),
    volunteerTargetDetailLabel: dashOr(program.volunteerTargetDetail),
    recruitmentPeriodLabel: resolveVolunteerPeriod(program, common),
    documentPassAnnouncementDate: program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod: program.documentPassAnnouncementMethod,
    interviewStartDate: program.interviewStartDate,
    interviewEndDate: program.interviewEndDate,
    interviewMethod: program.interviewMethod,
    finalPassAnnouncementDate: program.finalPassAnnouncementDate,
    finalPassAnnouncementMethod: program.finalPassAnnouncementMethod,
    contactOrganizationName: dashOr(
      info?.contactOrganizationName ?? common?.sponsorDisplayName
    ),
    contactPhone: dashOr(program.contactPhone),
    contactEmail: dashOr(program.contactEmail),
    notes: dashOr(program.oneLineIntroduction ?? program.otherNotes),
  }
}
