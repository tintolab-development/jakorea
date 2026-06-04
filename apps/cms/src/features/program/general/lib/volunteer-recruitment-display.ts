/**
 * 일반 프로그램 상세 — 봉사자 모집 정보 표시값 (등록 양식·스크린샷 mock)
 */

import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import {
  formatDateRange,
  getVolunteerRecruitmentStatus,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID } from '@/features/program/general/lib/detail-common-info-display'

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

function needOrNotLabel(value: boolean | undefined, yes = '게시', no = '미게시'): string {
  if (value == null) return '-'
  return value ? yes : no
}

function interviewEnabledLabel(value: boolean | undefined): string {
  if (value == null) return '-'
  return value ? '면접 있음' : '면접 없음'
}

function resolveVolunteerRecruitmentLifecycle(program: Program): ProgramLifecycleStatus | null {
  const status = getVolunteerRecruitmentStatus(program)
  if (status == null) return null
  return VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE[status]
}

function resolveVolunteerPeriod(program: Program, info?: Program['generalCommonInfo']) {
  const volunteerRecruitmentInfo = info?.volunteerRecruitmentInfo
  if (volunteerRecruitmentInfo?.recruitmentPeriodLabel) {
    return volunteerRecruitmentInfo.recruitmentPeriodLabel
  }
  const start =
    program.volunteerApplicationStartDate ??
    program.instructorApplicationStartDate ??
    program.applicationStartDate
  const end =
    program.volunteerApplicationEndDate ??
    program.instructorApplicationEndDate ??
    program.applicationEndDate
  return formatDateRange(start, end)
}

export function resolveGeneralProgramVolunteerRecruitmentDisplay(
  program: Program
): GeneralProgramVolunteerRecruitmentDisplay {
  const common = program.generalCommonInfo
  const info = common?.volunteerRecruitmentInfo
  const lifecycle = resolveVolunteerRecruitmentLifecycle(program)

  if (program.id === GENERAL_PROGRAM_ORG_CURRICULUM_SINGLE_ID) {
    return {
      ...JOB담_VOLUNTEER_RECRUITMENT_MOCK,
      recruitmentStatusLabel: getProgramLifecycleLabel('recruiting_volunteers'),
      recruitmentStatusLifecycle: 'recruiting_volunteers',
    }
  }

  const notes = (program.oneLineIntroduction ?? program.otherNotes ?? '').trim() || '-'

  return {
    announcementPublishedLabel: needOrNotLabel(info?.announcementPublished),
    interviewEnabledLabel: interviewEnabledLabel(program.generalVolunteerInterviewEnabled),
    operationPeriodLabel:
      info?.operationPeriodLabel ?? formatDateRange(program.startDate, program.endDate),
    recruitmentStatusLabel: lifecycle ? getProgramLifecycleLabel(lifecycle) : '-',
    recruitmentStatusLifecycle: lifecycle,
    volunteerTargetLabel: program.volunteerTarget ?? '대학(원)생',
    volunteerTargetDetailLabel: program.volunteerTargetDetail ?? '-',
    recruitmentPeriodLabel: resolveVolunteerPeriod(program, common),
    documentPassAnnouncementDate: program.documentPassAnnouncementDate,
    documentPassAnnouncementMethod:
      program.documentPassAnnouncementMethod ?? '홈페이지 공지 및 합격자 개별 안내',
    interviewStartDate: program.interviewStartDate,
    interviewEndDate: program.interviewEndDate,
    interviewMethod: program.interviewMethod,
    finalPassAnnouncementDate: program.finalPassAnnouncementDate,
    finalPassAnnouncementMethod:
      program.finalPassAnnouncementMethod ?? '홈페이지 공지 및 합격자 개별 안내',
    contactOrganizationName:
      info?.contactOrganizationName ?? common?.sponsorDisplayName ?? 'JA Korea',
    contactPhone: program.contactPhone ?? '-',
    contactEmail: program.contactEmail ?? '-',
    notes,
  }
}
